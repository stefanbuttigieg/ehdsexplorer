const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SHELL_MARKERS = /Official Journal of the European Union|available languages and formats|Display all languages|Choose language|multilingual display|language selector|Official Journal|Amtsblatt|Journal officiel/i;

const DOCUMENT_MARKERS = /\b(Article|Artikel|Artículo|Articolo|Artigo|Artykuł|Článek|Článok|Articolul|Член|Άρθρο|Artikkel|Airteagal|Artikolu)\s+\d+|(?:^|\n)\s*\d+\.\s*(?:cikk|artikla|pants|straipsnis|člen)\b|(?:^|\n)\s*\(\d+\)\s+/im;

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/i;
const CELEX_PATTERN = /^\d{5}[A-Z]\d{4}$/i;

const extractTextFromHtml = (html: string): string => {
  const withoutNoise = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<(br|p|div|li|tr|h1|h2|h3|h4|h5|h6|section|article|header|footer|table|tbody|thead|td|th)\b[^>]*>/gi, '\n')
    .replace(/<\/\w+>/g, ' ')
    .replace(/<[^>]+>/g, ' ');

  const decoded = withoutNoise
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => {
      const value = Number(code);
      return Number.isFinite(value) ? String.fromCharCode(value) : '';
    });

  return decoded
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const isShellPage = (html: string, text: string): boolean => {
  return SHELL_MARKERS.test(html) && !DOCUMENT_MARKERS.test(text);
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { celexNumber, languageCode } = await req.json();

    const rawCelex = String(celexNumber ?? '').trim().toUpperCase().replace(/^CELEX:/, '');
    if (!rawCelex || !CELEX_PATTERN.test(rawCelex)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid CELEX number format: "${rawCelex}"` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!languageCode || !LANGUAGE_CODE_PATTERN.test(String(languageCode))) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid language code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lang = String(languageCode).toUpperCase();
    const langLower = String(languageCode).toLowerCase();
    const celex = rawCelex;

    const urls = [
      `https://eur-lex.europa.eu/legal-content/${lang}/ALL/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/HTML/?uri=CELEX:${celex}`,
    ];

    let lastError = 'No successful EUR-Lex response';

    for (const url of urls) {
      const response = await fetch(url, {
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'accept-language': `${langLower},en;q=0.8`,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'cache-control': 'no-cache',
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status} for ${url}`;
        continue;
      }

      const html = await response.text();
      if (!html || html.length < 1000) {
        lastError = `Response too short from ${url}`;
        continue;
      }

      const text = extractTextFromHtml(html);
      if (!text || text.length < 1000) {
        lastError = `Extracted text too short from ${url}`;
        continue;
      }

      if (isShellPage(html, text)) {
        lastError = `Fetched EUR-Lex shell page instead of document body: ${url}`;
        continue;
      }

      return new Response(
        JSON.stringify({
          success: true,
          content: text,
          html,
          urlUsed: url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: lastError }),
      { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching EUR-Lex body:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch EUR-Lex body';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
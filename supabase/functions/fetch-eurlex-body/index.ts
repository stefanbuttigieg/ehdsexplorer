const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/i;
const CELEX_PATTERN = /^\d{5}[A-Z]\d{4}$/i;

// Shell-page markers — these appear on navigation/index pages, not the regulation body
const SHELL_MARKERS = /Official Journal of the European Union|available languages and formats|Display all languages|Choose language|multilingual display|language selector/i;

// Real document body markers — at least one article heading should be present
const ARTICLE_MARKERS = /\b(?:Article|Artikel|Artículo|Articolo|Artigo|Artykuł|Článek|Článok|Articolul|Член|Άρθρο|Artikkel|Airteagal|Artikolu)\s+\d+|(?:^|\n)\s*\d+\.\s*(?:cikk|artikla|pants|straipsnis|člen)\b/im;

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
    const celex = rawCelex;

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // EUR-Lex URL variants to try — TXT/HTML is usually the full rendered doc
    const urls = [
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/HTML/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/ALL/?uri=CELEX:${celex}`,
    ];

    let lastError = 'No successful EUR-Lex response';

    for (const url of urls) {
      console.log(`Fetching ${url} via Firecrawl...`);

      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${firecrawlKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'html'],
          onlyMainContent: false, // Get full page to avoid missing regulation body
          waitFor: 5000, // EUR-Lex uses JS rendering, wait longer
        }),
      });

      const fcData = await fcResponse.json();

      if (!fcResponse.ok || !fcData.success) {
        lastError = `Firecrawl error for ${url}: ${fcData.error || `HTTP ${fcResponse.status}`}`;
        console.log(lastError);
        continue;
      }

      const markdown = fcData.data?.markdown || '';
      const html = fcData.data?.html || '';

      if (markdown.length < 1000 && html.length < 1000) {
        lastError = `Content too short from ${url} (md: ${markdown.length}, html: ${html.length})`;
        console.log(lastError);
        continue;
      }

      // Check if this is a shell/navigation page rather than the document body
      const contentToCheck = markdown || html;
      if (SHELL_MARKERS.test(contentToCheck) && !ARTICLE_MARKERS.test(contentToCheck)) {
        lastError = `Shell page detected from ${url}`;
        console.log(lastError);
        continue;
      }

      // Verify we have actual article content
      if (!ARTICLE_MARKERS.test(contentToCheck)) {
        lastError = `No article markers found in content from ${url}`;
        console.log(lastError);
        continue;
      }

      console.log(`Success: ${markdown.length} chars markdown, ${html.length} chars html from ${url}`);

      return new Response(
        JSON.stringify({
          success: true,
          content: markdown,
          html: html,
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
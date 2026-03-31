const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_CODE_PATTERN = /^[a-z]{2}$/i;
const CELEX_PATTERN = /^\d{5}[A-Z]\d{4}$/i;

const SHELL_MARKERS = /Official Journal of the European Union|available languages and formats|Display all languages|Choose language|multilingual display|language selector/i;
const ARTICLE_MARKERS = /\b(?:Article|Artikel|Artículo|Articolo|Artigo|Artykuł|Článek|Článok|Članak|Articolul|Член|Άρθρο|Artikkel|Airteagal|Artikolu|Člen)\s+\d+|(?:^|\n)\s*\d+\.\s*(?:cikk|artikla|pants|straipsnis)\b/im;

function isShellPage(content: string): boolean {
  if (SHELL_MARKERS.test(content) && !ARTICLE_MARKERS.test(content)) return true;
  if (!ARTICLE_MARKERS.test(content) && content.length < 5000) return true;
  return false;
}

/** Convert HTML to clean text preserving structural line breaks */
function htmlToText(html: string): string {
  let text = html;
  
  // Step 0: Merge EUR-Lex two-column recital tables where number and content are in adjacent cells
  // Pattern: <td...>(N)</td><td...>content</td> → merge into single line
  text = text.replace(
    /<td[^>]*>\s*(?:<p[^>]*>)?\s*\((\d+)\)\s*(?:<\/p>)?\s*<\/td>\s*<td[^>]*>\s*(?:<p[^>]*>)?\s*/gi,
    '\n($1) '
  );
  
  // Add newlines before/after block elements
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(?:p|div|tr|li|h[1-6]|dt|dd|blockquote|section|article|header|footer|td|th)>/gi, '\n');
  text = text.replace(/<(?:p|div|tr|li|h[1-6]|dt|dd|blockquote|section|article|header|footer)\b[^>]*>/gi, '\n');
  // Table cells get a space
  text = text.replace(/<(?:td|th)\b[^>]*>/gi, ' ');
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, '');
  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, '\u2019');
  text = text.replace(/&lsquo;/g, '\u2018');
  text = text.replace(/&rdquo;/g, '\u201D');
  text = text.replace(/&ldquo;/g, '\u201C');
  text = text.replace(/&mdash;/g, '\u2014');
  text = text.replace(/&ndash;/g, '\u2013');
  text = text.replace(/&#\d+;/g, (m) => {
    const code = parseInt(m.slice(2, -1));
    return String.fromCharCode(code);
  });
  // Normalize non-breaking spaces and other Unicode whitespace to regular spaces
  text = text.replace(/[\u00A0\u2007\u202F\u2060]/g, ' ');
  // Normalize whitespace per line
  text = text.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).join('\n');
  // Collapse multiple blank lines
  text = text.replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

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

    // URL variants to try
    const urls = [
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/HTML/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/TXT/?uri=CELEX:${celex}`,
      `https://eur-lex.europa.eu/legal-content/${lang}/ALL/?uri=CELEX:${celex}`,
    ];

    let lastError = 'No successful EUR-Lex response';

    // --- Strategy 1: Direct fetch with proper headers ---
    for (const url of urls) {
      console.log(`Direct fetch: ${url}`);
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': `${lang.toLowerCase()},en;q=0.5`,
          },
        });

        if (!res.ok) {
          lastError = `HTTP ${res.status} from ${url}`;
          console.log(lastError);
          await res.text(); // consume body
          continue;
        }

        const html = await res.text();

        if (html.length < 1000) {
          lastError = `Content too short from ${url} (${html.length} chars)`;
          console.log(lastError);
          continue;
        }

        // Convert HTML to clean text for the content field
        const textContent = htmlToText(html);

        if (isShellPage(textContent)) {
          lastError = `Shell page from direct fetch: ${url}`;
          console.log(lastError);
          continue;
        }

        console.log(`Direct fetch success: ${textContent.length} text chars from ${url}`);
        return new Response(
          JSON.stringify({ success: true, content: textContent, html, urlUsed: url }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (e) {
        lastError = `Direct fetch error for ${url}: ${e instanceof Error ? e.message : String(e)}`;
        console.log(lastError);
      }
    }

    // --- Strategy 2: Firecrawl fallback (JS-rendered) ---
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (firecrawlKey) {
      for (const url of urls.slice(0, 2)) {
        console.log(`Firecrawl fetch: ${url}`);
        try {
          const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${firecrawlKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url,
              formats: ['markdown', 'html'],
              onlyMainContent: false,
              waitFor: 5000,
            }),
          });

          const fcData = await fcResponse.json();

          if (!fcResponse.ok || !fcData.success) {
            lastError = `Firecrawl error for ${url}: ${fcData.error || `HTTP ${fcResponse.status}`}`;
            console.log(lastError);
            continue;
          }

          const markdown = fcData.data?.markdown || '';
          const fcHtml = fcData.data?.html || '';
          const content = markdown || htmlToText(fcHtml);

          if (content.length < 1000) {
            lastError = `Firecrawl content too short from ${url}`;
            console.log(lastError);
            continue;
          }

          if (isShellPage(content)) {
            lastError = `Shell page via Firecrawl: ${url}`;
            console.log(lastError);
            continue;
          }

          console.log(`Firecrawl success: ${content.length} chars from ${url}`);
          return new Response(
            JSON.stringify({ success: true, content, html: fcHtml, urlUsed: url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (e) {
          lastError = `Firecrawl error: ${e instanceof Error ? e.message : String(e)}`;
          console.log(lastError);
        }
      }
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

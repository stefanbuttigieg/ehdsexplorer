const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfUrl } = await req.json();

    if (!pdfUrl || typeof pdfUrl !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'pdfUrl is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Firecrawl scraping PDF: ${pdfUrl}`);

    const fcResponse = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: pdfUrl,
        formats: ['markdown'],
        onlyMainContent: false,
      }),
    });

    const fcData = await fcResponse.json();

    if (!fcResponse.ok) {
      const errorMsg = fcData?.error || `Firecrawl HTTP ${fcResponse.status}`;
      console.error('Firecrawl error:', errorMsg);
      return new Response(
        JSON.stringify({ success: false, error: errorMsg }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // v2 returns content under `data` or top-level depending on response shape
    const markdown = fcData?.data?.markdown || fcData?.markdown || '';

    if (!markdown || markdown.length < 500) {
      return new Response(
        JSON.stringify({ success: false, error: `Firecrawl returned empty or too-short content (${markdown.length} chars)` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Firecrawl success: ${markdown.length} chars`);

    return new Response(
      JSON.stringify({ success: true, content: markdown, source: 'firecrawl' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('parse-implementing-act-pdf error:', message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

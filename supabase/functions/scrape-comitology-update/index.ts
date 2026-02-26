import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COMITOLOGY_URL = 'https://ec.europa.eu/transparency/comitology-register/screen/committees/C131500';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping Comitology Register:', COMITOLOGY_URL);

    // Use Firecrawl to scrape the page
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: COMITOLOGY_URL,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 10000, // Wait for JS-rendered content
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Scrape failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
    const title = scrapeData.data?.metadata?.title || scrapeData.metadata?.title || 'Comitology Register Update';

    // Extract a useful summary from the scraped content (first meaningful section)
    const lines = markdown.split('\n').filter((l: string) => l.trim().length > 0);
    const summary = lines.slice(0, 15).join('\n').substring(0, 1000);

    // Store in database using service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Insert new update
    const { data: inserted, error: insertError } = await supabase
      .from('comitology_updates')
      .insert({
        title: title.substring(0, 255),
        summary: summary,
        source_url: COMITOLOGY_URL,
        scraped_content: markdown.substring(0, 10000),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Keep only the latest 10 updates to avoid bloat
    const { data: allUpdates } = await supabase
      .from('comitology_updates')
      .select('id')
      .order('scraped_at', { ascending: false });

    if (allUpdates && allUpdates.length > 10) {
      const idsToDelete = allUpdates.slice(10).map((u: any) => u.id);
      await supabase.from('comitology_updates').delete().in('id', idsToDelete);
    }

    console.log('Comitology update cached successfully');
    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

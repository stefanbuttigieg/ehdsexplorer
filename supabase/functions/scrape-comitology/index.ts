import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { fetchCommitteeMeetings } from './meetings.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) throw new Error('Meeting storage is not configured');
    const scrapedAt = new Date().toISOString();
    const meetings = await fetchCommitteeMeetings();
    const updates = meetings.map(m => ({
      title: m.title,
      source_url: m.url,
      scraped_content: JSON.stringify(m),
      summary: `${m.meeting_code} - ${m.date}`,
      scraped_at: scrapedAt,
    }));
    // Save and retire outdated register rows together, only after complete retrieval.
    const saved = await fetch(`${supabaseUrl}/rest/v1/rpc/sync_committee_meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ _updates: updates, _scraped_at: scrapedAt }),
    });
    if (!saved.ok) throw new Error(`Failed to save committee meetings (${saved.status})`);
    return new Response(JSON.stringify({ success: true, data: { meetings, total: meetings.length, scraped_at: scrapedAt } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Committee meeting refresh failed:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Meeting refresh failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

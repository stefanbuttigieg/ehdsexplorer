const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComitologyMeeting {
  meeting_code: string;
  title: string;
  date: string;
  committee: string;
  url: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const committeeUrl = 'https://ec.europa.eu/transparency/comitology-register/screen/committees/C131500';
    
    // Scrape the committee page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: committeeUrl,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 5000, // Wait longer for JS-rendered content
      }),
    });

    const scrapeData = await response.json();
    if (!response.ok || !scrapeData.success) {
      throw new Error(scrapeData.error || 'Failed to scrape comitology register');
    }

    const markdown = scrapeData.data?.markdown || '';

    // Parse meetings from markdown
    // Meetings appear as: CMTD(2026)90 followed by committee name and title with link, then date
    const meetings: ComitologyMeeting[] = [];
    const lines = markdown.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Match meeting codes like CMTD(2026)90
      const codeMatch = line.match(/^(?:-\s*)?CMTD\((\d{4})\)(\d+)/);
      if (codeMatch) {
        const meetingCode = `CMTD(${codeMatch[1]})${codeMatch[2]}`;
        
        // Look ahead for title (link) and date
        let title = '';
        let date = '';
        let url = '';
        
        for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
          const nextLine = lines[j].trim();
          
          // Title is usually in a markdown link
          const linkMatch = nextLine.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch && !title) {
            title = linkMatch[1];
            url = linkMatch[2];
          }
          
          // Date pattern: DD Month YYYY or DD/MM/YYYY
          const dateMatch = nextLine.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
          if (dateMatch && !date) {
            date = dateMatch[1];
          }
        }
        
        if (title || date) {
          meetings.push({
            meeting_code: meetingCode,
            title: title || `Meeting ${meetingCode}`,
            date: date || 'TBD',
            committee: 'Committee on the European Health Data Space',
            url: url || `https://ec.europa.eu/transparency/comitology-register/screen/meetings/${encodeURIComponent(meetingCode)}`,
          });
        }
      }
    }

    // Save to comitology_updates table
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (meetings.length > 0) {
      const updates = meetings.map(m => ({
        title: m.title,
        source_url: m.url,
        scraped_content: JSON.stringify(m),
        summary: `${m.meeting_code} - ${m.date}`,
        scraped_at: new Date().toISOString(),
      }));

      const upsertRes = await fetch(`${supabaseUrl}/rest/v1/comitology_updates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(updates),
      });

      if (!upsertRes.ok) {
        const errBody = await upsertRes.text();
        console.error('Failed to save meetings:', errBody);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          meetings,
          total: meetings.length,
          scraped_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping comitology:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

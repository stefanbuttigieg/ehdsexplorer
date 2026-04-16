import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get config
    const { data: config, error: configError } = await supabase
      .from('eu_regulation_check_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !config) {
      console.error('No config found:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'No configuration found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!config.is_enabled) {
      return new Response(
        JSON.stringify({ success: true, message: 'Checking is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = config.target_url;
    console.log(`Scraping: ${targetUrl}`);

    // Scrape the page using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: targetUrl,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl scrape failed:', errorText);
      return new Response(
        JSON.stringify({ success: false, error: `Scrape failed: ${scrapeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    const markdown = scrapeData?.data?.markdown || scrapeData?.markdown || '';

    if (!markdown) {
      console.error('No markdown content returned');
      return new Response(
        JSON.stringify({ success: false, error: 'No content scraped' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate a simple hash of the content
    const encoder = new TextEncoder();
    const data = encoder.encode(markdown);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Compare with last known hash
    const hasChanged = config.last_content_hash !== contentHash;

    // Update config with last checked time
    await supabase
      .from('eu_regulation_check_config')
      .update({
        last_checked_at: new Date().toISOString(),
        last_content_hash: contentHash,
      })
      .eq('id', config.id);

    if (!hasChanged) {
      console.log('No changes detected');
      return new Response(
        JSON.stringify({ success: true, changed: false, message: 'No changes detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Content has changed - store the update
    const title = scrapeData?.data?.metadata?.title || scrapeData?.metadata?.title || 'EU Better Regulation Update';
    const description = scrapeData?.data?.metadata?.description || scrapeData?.metadata?.description || '';

    const { error: insertError } = await supabase
      .from('eu_regulation_updates')
      .insert({
        title: title.substring(0, 500),
        description: description.substring(0, 1000),
        source_url: targetUrl,
        scraped_content: markdown,
        content_hash: contentHash,
        status: 'new',
      });

    if (insertError) {
      console.error('Failed to insert update:', insertError);
    }

    // Send email notification to super admins
    try {
      // Get super admin emails
      const { data: superAdminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'super_admin');

      if (superAdminRoles && superAdminRoles.length > 0) {
        const userIds = superAdminRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('email')
          .in('user_id', userIds);

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        if (resendApiKey && profiles && profiles.length > 0) {
          const adminEmails = profiles
            .map(p => p.email)
            .filter(Boolean);

          if (adminEmails.length > 0) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a56db;">🔔 EU Regulation Update Detected</h2>
                <p>A change has been detected on the EU Better Regulation page for EHDS dataset descriptions.</p>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
                  <p><strong>Page:</strong> ${title}</p>
                  <p><strong>URL:</strong> <a href="${targetUrl}">${targetUrl}</a></p>
                  <p><strong>Detected at:</strong> ${new Date().toISOString()}</p>
                </div>
                <p>Please review the update in your <a href="https://ehdsexplorer.eu/admin/eu-regulation-updates">Admin Portal</a>.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
                <p style="color: #6b7280; font-size: 12px;">This is an automated notification from EHDS Explorer.</p>
              </div>
            `;

            for (const email of adminEmails) {
              try {
                await fetch('https://api.resend.com/emails', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    from: 'EHDS Explorer <notifications@ehdsexplorer.eu>',
                    to: [email],
                    subject: '🔔 EU Regulation Update Detected - EHDS Dataset Descriptions',
                    html: emailHtml,
                  }),
                });
                console.log(`Notification sent to ${email}`);
              } catch (emailError) {
                console.error(`Failed to send email to ${email}:`, emailError);
              }
            }
          }
        }
      }
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
    }

    console.log('Change detected and stored successfully');
    return new Response(
      JSON.stringify({ success: true, changed: true, message: 'Update detected and stored' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in EU regulation check:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

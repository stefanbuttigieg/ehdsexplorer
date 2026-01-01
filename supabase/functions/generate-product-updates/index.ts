import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CHANGELOG_URL = "https://raw.githubusercontent.com/ehds-explorer/ehds-regulation-explorer/main/CHANGELOG.md";

const PRODUCT_UPDATES_PROMPT = `You are a product communications expert for the EHDS Regulation Explorer, a digital platform for exploring EU health data space regulations.

Based on the changelog entries provided, generate an engaging and accessible news summary highlighting new features and improvements to the EHDS Explorer platform.

Guidelines:
1. **Tone**: Friendly, professional, and user-focused
2. **Structure**: Group related features together logically
3. **Accessibility**: Explain technical features in plain language that any user can understand
4. **Benefits**: Focus on how each feature helps users (not just what it does)
5. **Call to Action**: Encourage users to try new features

Format the summary in clear markdown with:
- An engaging headline
- Brief intro paragraph
- Feature highlights with user benefits
- A closing note encouraging feedback

Keep the summary concise but comprehensive - aim for 300-500 words.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request body to get optional changelog content
    let changelogContent = "";
    try {
      const body = await req.json();
      if (body.changelog) {
        changelogContent = body.changelog;
        console.log("Using provided changelog content");
      }
    } catch {
      // No body provided, will fetch from URL or use fallback
    }

    // Try to fetch changelog from GitHub if not provided
    if (!changelogContent) {
      try {
        const changelogResponse = await fetch(CHANGELOG_URL);
        if (changelogResponse.ok) {
          changelogContent = await changelogResponse.text();
          console.log("Fetched changelog from GitHub");
        }
      } catch (e) {
        console.log("Could not fetch from GitHub, will use local data");
      }
    }

    // If still no changelog, fetch from page_content table
    if (!changelogContent) {
      const { data: pageData } = await supabase
        .from('page_content')
        .select('content')
        .eq('id', 'changelog')
        .single();
      
      if (pageData?.content?.text) {
        changelogContent = pageData.content.text;
        console.log("Using changelog from database");
      }
    }

    // If we still don't have content, provide a helpful error
    if (!changelogContent) {
      throw new Error("No changelog content available. Please provide changelog in the request body.");
    }

    // Calculate current week dates
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    console.log(`Generating product updates summary for week: ${weekStartStr} to ${weekEndStr}`);

    // Fetch custom prompt from database
    let customPrompt = PRODUCT_UPDATES_PROMPT;
    const { data: promptData } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'product-updates-prompt')
      .single();

    if (promptData?.content?.prompt) {
      customPrompt = promptData.content.prompt;
      console.log("Using custom product updates prompt from database");
    }

    // Build final prompt
    const fullPrompt = `${customPrompt}

Here is the changelog for the EHDS Explorer platform:

${changelogContent}

Generate a user-friendly product updates summary based on the most recent changes (focus on the latest version entries).`;

    // Generate AI summary
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a friendly product communications expert who creates engaging feature announcements for the EHDS Regulation Explorer platform." },
          { role: "user", content: fullPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated from AI");
    }

    console.log("AI generated product updates content successfully");

    // Extract title from content
    const lines = content.split('\n').filter((l: string) => l.trim());
    let title = `EHDS Explorer Updates: ${weekStartStr}`;
    let summary = content;

    if (lines[0]?.startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      summary = lines.slice(1).join('\n').trim();
    } else if (lines[0]?.startsWith('**') && lines[0]?.endsWith('**')) {
      title = lines[0].replace(/\*\*/g, '').trim();
      summary = lines.slice(1).join('\n').trim();
    }

    // Save to database with 'product_update' as generated_by
    const { data: newSummary, error: insertError } = await supabase
      .from('news_summaries')
      .insert({
        title,
        summary,
        week_start: weekStartStr,
        week_end: weekEndStr,
        generated_by: 'product_update',
        is_published: false,
        sources: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to save summary: ${insertError.message}`);
    }

    console.log("Product updates summary saved with id:", newSummary.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: newSummary.id,
        title: newSummary.title,
        message: "Product updates summary generated successfully. Review and publish from admin." 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-product-updates:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

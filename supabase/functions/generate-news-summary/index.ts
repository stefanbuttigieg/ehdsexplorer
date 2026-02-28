import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_PROMPT = `You are an expert analyst on the European Health Data Space (EHDS) Regulation (EU) 2025/327.

Generate a comprehensive weekly news summary about developments related to the EHDS Regulation. The summary should cover:

1. **Recent Developments**: Any new implementing acts, delegated acts, or regulatory updates
2. **Member State Implementation**: Progress in EU member states adopting EHDS requirements
3. **Health Data Access Bodies**: Updates on national HDAB establishment
4. **EHR Systems**: News about electronic health record system certifications and compliance
5. **Secondary Use of Data**: Developments in health data research access and governance
6. **Stakeholder Activities**: Relevant activities from the European Commission, EHDS Board, or health data stakeholders

IMPORTANT: For each news item or development mentioned, include a source URL in markdown format [Source Name](URL). Use real, verifiable sources from official EU institutions, news outlets, or regulatory bodies.

Format the summary in clear markdown with sections. Be informative and factual. If there are no major developments, provide context on ongoing implementation timelines and upcoming milestones from the regulation.`;

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

    // Fetch configured AI model
    let aiModel = "google/gemini-2.5-flash";
    const { data: siteSettings } = await supabase
      .from("site_settings")
      .select("ai_model")
      .eq("id", "default")
      .single();
    if (siteSettings?.ai_model) {
      aiModel = siteSettings.ai_model;
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

    console.log(`Generating news summary for week: ${weekStartStr} to ${weekEndStr}`);

    // Check if summary already exists for this week
    const { data: existing } = await supabase
      .from('news_summaries')
      .select('id')
      .eq('week_start', weekStartStr)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Summary already exists for this week", id: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch custom prompt from database
    let customPrompt = DEFAULT_PROMPT;
    const { data: promptData } = await supabase
      .from('page_content')
      .select('content')
      .eq('id', 'news-prompt')
      .single();

    if (promptData?.content?.prompt) {
      customPrompt = promptData.content.prompt;
      console.log("Using custom prompt from database");
    }

    // Build final prompt with week dates
    const fullPrompt = `${customPrompt}

Week period: ${weekStartStr} to ${weekEndStr}

Generate a title for this week's summary and the content. Make sure to include source URLs for any news items mentioned.`;

    // Generate AI summary
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: "You are an expert on EU health data regulations, specifically the European Health Data Space (EHDS) Regulation." },
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

    console.log("AI generated content successfully");

    // Extract title from content (first line or generate one)
    const lines = content.split('\n').filter((l: string) => l.trim());
    let title = `EHDS Weekly Summary: ${weekStartStr}`;
    let summary = content;

    // Try to extract title if it starts with # or **
    if (lines[0]?.startsWith('#')) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      summary = lines.slice(1).join('\n').trim();
    } else if (lines[0]?.startsWith('**') && lines[0]?.endsWith('**')) {
      title = lines[0].replace(/\*\*/g, '').trim();
      summary = lines.slice(1).join('\n').trim();
    }

    // Extract source URLs from the content
    const urlRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
    const sources: string[] = [];
    let match;
    while ((match = urlRegex.exec(summary)) !== null) {
      sources.push(match[2]);
    }

    console.log(`Extracted ${sources.length} source URLs`);

    // Save to database
    const { data: newSummary, error: insertError } = await supabase
      .from('news_summaries')
      .insert({
        title,
        summary,
        week_start: weekStartStr,
        week_end: weekEndStr,
        generated_by: 'ai',
        is_published: false,
        sources,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error(`Failed to save summary: ${insertError.message}`);
    }

    console.log("Summary saved with id:", newSummary.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: newSummary.id,
        title: newSummary.title,
        message: "Summary generated successfully. Review and publish from admin." 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-news-summary:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

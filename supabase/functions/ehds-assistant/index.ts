import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch relevant content for context
    console.log("Fetching EHDS content for context...");
    
    const [articlesRes, recitalsRes, definitionsRes, chaptersRes, implementingActsRes] = await Promise.all([
      supabase.from("articles").select("article_number, title, content").order("article_number"),
      supabase.from("recitals").select("recital_number, content, related_articles").order("recital_number"),
      supabase.from("definitions").select("term, definition, source_article").order("term"),
      supabase.from("chapters").select("chapter_number, title, description").order("chapter_number"),
      supabase.from("implementing_acts").select("id, title, description, status, article_reference, type, theme"),
    ]);

    // Build context from database content
    const articles = articlesRes.data || [];
    const recitals = recitalsRes.data || [];
    const definitions = definitionsRes.data || [];
    const chapters = chaptersRes.data || [];
    const implementingActs = implementingActsRes.data || [];

    // Create a comprehensive but concise context
    const articlesSummary = articles.map(a => 
      `Article ${a.article_number}: ${a.title}\n${a.content.substring(0, 500)}${a.content.length > 500 ? '...' : ''}`
    ).join("\n\n");

    const definitionsList = definitions.map(d => 
      `"${d.term}": ${d.definition}`
    ).join("\n");

    const chaptersList = chapters.map(c => 
      `Chapter ${c.chapter_number}: ${c.title}${c.description ? ` - ${c.description}` : ''}`
    ).join("\n");

    const implementingActsList = implementingActs.map(ia => 
      `${ia.id}: ${ia.title} (${ia.status}) - ${ia.type}, Theme: ${ia.theme}, Reference: ${ia.article_reference}`
    ).join("\n");

    const recitalsSummary = recitals.slice(0, 50).map(r => 
      `Recital (${r.recital_number}): ${r.content.substring(0, 300)}${r.content.length > 300 ? '...' : ''}`
    ).join("\n\n");

    const systemPrompt = `You are an expert AI assistant for the European Health Data Space (EHDS) Regulation (EU) 2025/327. Your role is to help users understand and navigate the regulation.

IMPORTANT GUIDELINES:
1. Only answer questions based on the EHDS regulation content provided below
2. If you don't know or the information isn't in the regulation, say so clearly
3. When citing, always reference specific articles, recitals, or definitions
4. Provide clear, accurate information without speculation
5. For navigation requests, guide users to the relevant articles or sections
6. Keep answers concise but comprehensive
7. Use plain language while maintaining legal accuracy

EHDS REGULATION STRUCTURE:
${chaptersList}

KEY DEFINITIONS (Article 2):
${definitionsList}

ARTICLES CONTENT:
${articlesSummary}

RECITALS (Background/Intent):
${recitalsSummary}

IMPLEMENTING ACTS STATUS:
${implementingActsList}

When users ask about specific topics, reference the most relevant articles and explain how they apply. For navigation requests, provide direct references to articles, chapters, or definitions that address their query.`;

    console.log("Calling Lovable AI gateway...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Streaming response...");
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("EHDS assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

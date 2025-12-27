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
    const { contentType, contentId } = await req.json();
    
    if (!contentType || !contentId) {
      return new Response(
        JSON.stringify({ error: "Missing contentType or contentId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["article", "recital"].includes(contentType)) {
      return new Response(
        JSON.stringify({ error: "Invalid contentType. Must be 'article' or 'recital'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client to fetch content
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the content based on type
    let originalContent: string;
    let contentTitle: string;
    let contentNumber: number;

    if (contentType === "article") {
      const { data, error } = await supabase
        .from("articles")
        .select("article_number, title, content")
        .eq("article_number", contentId)
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching article:", error);
        return new Response(
          JSON.stringify({ error: "Article not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      originalContent = data.content;
      contentTitle = data.title;
      contentNumber = data.article_number;
    } else {
      const { data, error } = await supabase
        .from("recitals")
        .select("recital_number, content")
        .eq("recital_number", contentId)
        .maybeSingle();

      if (error || !data) {
        console.error("Error fetching recital:", error);
        return new Response(
          JSON.stringify({ error: "Recital not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      originalContent = data.content;
      contentTitle = `Recital ${data.recital_number}`;
      contentNumber = data.recital_number;
    }

    console.log(`Generating plain language translation for ${contentType} ${contentNumber}`);

    const systemPrompt = `You are a legal plain language translator specializing in EU health data regulations. Your task is to convert complex legal text from the European Health Data Space (EHDS) Regulation into clear, accessible language that non-experts can understand.

Guidelines:
- Use simple, everyday words instead of legal jargon
- Break down complex sentences into shorter, clearer ones
- Explain technical terms when they cannot be avoided
- Maintain the essential meaning and legal intent
- Structure the content with clear paragraphs
- Use bullet points for lists where appropriate
- Write in an informative, neutral tone
- Keep the plain language version roughly the same length as the original
- Do not add information that is not in the original text
- Focus on what the provision means in practice for affected parties

Important: Output only the plain language translation, without any preamble or commentary.`;

    const userPrompt = contentType === "article"
      ? `Please translate the following article from the EHDS Regulation into plain, accessible language:

Article ${contentNumber}: ${contentTitle}

${originalContent}`
      : `Please translate the following recital from the EHDS Regulation into plain, accessible language:

Recital ${contentNumber}:

${originalContent}`;

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
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate translation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const plainLanguageText = data.choices?.[0]?.message?.content;

    if (!plainLanguageText) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "Failed to generate translation" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated translation for ${contentType} ${contentNumber}`);

    return new Response(
      JSON.stringify({ 
        plainLanguageText,
        contentType,
        contentId: contentNumber,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in generate-plain-language:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

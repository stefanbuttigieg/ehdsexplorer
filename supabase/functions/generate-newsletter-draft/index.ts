import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["super_admin", "admin"])
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, tone } = await req.json();

    // Gather recent context from the database
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [newsResult, iaResult, legislationResult] = await Promise.all([
      serviceClient.from("news_summaries").select("title, summary").gte("created_at", oneWeekAgo).order("created_at", { ascending: false }).limit(10),
      serviceClient.from("implementing_acts").select("title, status, adopted_date").order("updated_at", { ascending: false }).limit(5),
      serviceClient.from("country_legislation").select("country_name, title, status").gte("updated_at", oneWeekAgo).order("updated_at", { ascending: false }).limit(10),
    ]);

    const contextParts: string[] = [];

    if (newsResult.data?.length) {
      contextParts.push("## Recent News\n" + newsResult.data.map(n => `- **${n.title}**: ${n.summary || ''}`).join("\n"));
    }
    if (iaResult.data?.length) {
      contextParts.push("## Implementing Acts Updates\n" + iaResult.data.map(ia => `- **${ia.title}** (Status: ${ia.status || 'N/A'}${ia.adopted_date ? `, Adopted: ${ia.adopted_date}` : ''})`).join("\n"));
    }
    if (legislationResult.data?.length) {
      contextParts.push("## Country Legislation Updates\n" + legislationResult.data.map(l => `- **${l.country_name}**: ${l.title} (${l.status || 'N/A'})`).join("\n"));
    }

    const contextBlock = contextParts.length > 0
      ? `Here is recent content from the EHDS Explorer platform to reference:\n\n${contextParts.join("\n\n")}`
      : "No recent updates were found in the database this week.";

    const toneInstruction = tone === "formal"
      ? "Use a formal, professional tone suitable for policymakers and healthcare executives."
      : tone === "casual"
      ? "Use a friendly, approachable tone that is still professional."
      : "Use a balanced professional yet accessible tone.";

    const systemPrompt = `You are a newsletter writer for EHDS Explorer (ehdsexplorer.eu), a platform tracking the European Health Data Space regulation.
Write a newsletter email body in HTML format. The content should be well-structured with headings, bullet points, and clear sections.
${toneInstruction}
Do NOT include the email subject line in the body. Do NOT include <html>, <head>, or <body> tags — just the inner content.
Keep it concise but informative. Include a brief intro paragraph and sign off with "The EHDS Explorer Team".

${contextBlock}`;

    const userPrompt = prompt || "Write a weekly newsletter update summarizing the latest EHDS developments, regulatory updates, and platform highlights.";

    // Get AI model from settings
    const { data: modelSetting } = await serviceClient
      .from("site_settings")
      .select("value")
      .eq("key", "ai_model")
      .maybeSingle();

    const model = modelSetting?.value || "google/gemini-3-flash-preview";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await aiResponse.json();
    const draft = result.choices?.[0]?.message?.content || "";

    // Also generate a suggested subject line
    const subjectResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "Generate a single concise email subject line for this EHDS Explorer newsletter. Return ONLY the subject line, nothing else." },
          { role: "user", content: draft.substring(0, 500) },
        ],
      }),
    });

    let suggestedSubject = "";
    if (subjectResponse.ok) {
      const subjectResult = await subjectResponse.json();
      suggestedSubject = (subjectResult.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    } else {
      await subjectResponse.text();
    }

    return new Response(JSON.stringify({ draft, suggestedSubject }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Newsletter draft error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate draft" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

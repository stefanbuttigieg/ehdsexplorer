import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { targetLanguage, targetLanguageName, keys } = await req.json();

    if (!targetLanguage || !keys || !Array.isArray(keys) || keys.length === 0) {
      return new Response(
        JSON.stringify({ error: "targetLanguage and keys[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get AI model from site_settings
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: modelSetting } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "ai_model")
      .maybeSingle();
    const model = modelSetting?.value || "google/gemini-3-flash-preview";

    // Build translation prompt
    const keysJson = JSON.stringify(keys, null, 2);
    const prompt = `Translate the following UI strings from English to ${targetLanguageName || targetLanguage}. 
These are short UI labels, button texts, menu items, and tooltips for a European Health Data Space (EHDS) regulation explorer website.

Rules:
- Keep translations concise (similar length to English)
- Preserve any technical terms like "EHDS", "EUR-Lex" as-is
- Use formal/professional tone
- Do not translate brand names

Input (array of {key, value} objects):
${keysJson}

Return a JSON array with the same structure but translated values. Only return the JSON array, nothing else.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a professional translator for EU regulatory software. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI translation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Extract JSON from response (might be wrapped in markdown code blocks)
    let translatedKeys: Array<{ key: string; value: string }> = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        translatedKeys = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI translation response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert translations
    const upsertRows = translatedKeys.map((t) => ({
      key: t.key,
      language_code: targetLanguage,
      value: t.value,
      is_ai_generated: true,
      updated_at: new Date().toISOString(),
    }));

    if (upsertRows.length > 0) {
      const { error: upsertError } = await adminClient
        .from("ui_translations")
        .upsert(upsertRows, { onConflict: "key,language_code" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to save translations: " + upsertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        translated: translatedKeys.length,
        translations: translatedKeys,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

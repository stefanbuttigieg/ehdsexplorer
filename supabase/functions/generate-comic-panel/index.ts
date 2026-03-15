import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { imagePrompt, storyTitle, panelIndex, totalPanels, characterDescriptions, previousPanelSummaries } = await req.json();

    if (!imagePrompt) {
      return new Response(
        JSON.stringify({ error: "imagePrompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let continuityContext = "";
    if (characterDescriptions) {
      continuityContext += `\n\nIMPORTANT — Character consistency: Maintain these EXACT character designs throughout ALL panels:\n${characterDescriptions}`;
    }
    if (previousPanelSummaries && previousPanelSummaries.length > 0) {
      continuityContext += `\n\nPrevious panels for visual continuity (keep same art style, colors, character designs):\n${previousPanelSummaries.map((s: string, i: number) => `Panel ${i + 1}: ${s}`).join("\n")}`;
    }
    if (panelIndex !== undefined && totalPanels) {
      continuityContext += `\n\nThis is panel ${panelIndex + 1} of ${totalPanels}. Maintain consistent art style across all panels.`;
    }

    const fullPrompt = `Create a vibrant, colorful comic book panel illustration. Style: clean lines, bright colors, child-friendly, European setting, consistent character designs. No text, speech bubbles, or written words in the image. Story: "${storyTitle}". Scene: ${imagePrompt}${continuityContext}`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: fullPrompt,
            },
          ],
          modalities: ["image", "text"],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    if (!imageUrl) {
      throw new Error("No image returned from AI gateway");
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating comic panel:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

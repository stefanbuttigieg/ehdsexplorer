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

    const { imagePrompt, storyTitle, panelIndex, totalPanels, characterDescriptions, previousPanelSummaries, referenceImageUrls } = await req.json();

    if (!imagePrompt) {
      return new Response(
        JSON.stringify({ error: "imagePrompt is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build character continuity context
    let continuityContext = "";
    if (characterDescriptions) {
      continuityContext += `\n\nCRITICAL CHARACTER CONSISTENCY RULES:\nYou MUST draw these characters EXACTLY as described. Every detail matters — hair style, hair color, skin tone, clothing, accessories. Do NOT change any aspect of their appearance:\n${characterDescriptions}`;
    }
    if (previousPanelSummaries && previousPanelSummaries.length > 0) {
      continuityContext += `\n\nPrevious panel descriptions for visual continuity (maintain IDENTICAL character appearances, art style, and color palette):\n${previousPanelSummaries.map((s: string, i: number) => `Panel ${i + 1}: ${s}`).join("\n")}`;
    }
    if (panelIndex !== undefined && totalPanels) {
      continuityContext += `\n\nThis is panel ${panelIndex + 1} of ${totalPanels}. Characters MUST look identical to previous panels.`;
    }

    const systemInstruction = `You are a comic book artist creating panels for a children's educational comic. Your absolute top priority is CHARACTER CONSISTENCY — every character must look EXACTLY the same across all panels. Same face shape, same hair, same skin tone, same clothes, same proportions. Style: clean lines, bright colors, child-friendly, European setting. NEVER include any text, speech bubbles, captions, or written words in the image.`;

    const fullPrompt = `Create a comic book panel illustration for the story "${storyTitle}".\n\nScene: ${imagePrompt}${continuityContext}`;

    // Build message content array with reference images for character consistency
    const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

    // Include reference images from previously generated panels
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      contentParts.push({
        type: "text",
        text: "REFERENCE IMAGES — These are previously generated panels from the same story. You MUST match the exact character appearances, art style, line work, and color palette shown in these images:"
      });

      for (let i = 0; i < referenceImageUrls.length; i++) {
        const url = referenceImageUrls[i];
        if (url) {
          contentParts.push({
            type: "image_url",
            image_url: { url }
          });
          contentParts.push({
            type: "text",
            text: `(Above: Panel ${i + 1} — use this as a visual reference for character consistency)`
          });
        }
      }

      contentParts.push({
        type: "text",
        text: `\n\nNow generate the NEW panel below. Characters MUST look identical to the reference images above.\n\n${fullPrompt}`
      });
    } else {
      contentParts.push({
        type: "text",
        text: fullPrompt
      });
    }

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
              role: "system",
              content: systemInstruction
            },
            {
              role: "user",
              content: contentParts,
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

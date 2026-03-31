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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    const sourceUrl = "https://health.ec.europa.eu/ehealth-digital-health-and-care/ehds-action_en";

    console.log("Checking for EHDS FAQ updates from:", sourceUrl);

    // Scrape the EU source page to find the PDF link
    let pdfUrl: string | null = null;

    if (FIRECRAWL_API_KEY) {
      const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: sourceUrl,
          formats: ["links"],
          onlyMainContent: false,
        }),
      });

      if (scrapeResponse.ok) {
        const scrapeData = await scrapeResponse.json();
        const links = scrapeData?.data?.links || scrapeData?.links || [];
        // Find the FAQ PDF link
        pdfUrl = links.find((link: string) =>
          link.includes("ehds_qa") || link.includes("ehds-qa") || 
          (link.includes("ehealth") && link.includes("qa") && link.endsWith(".pdf"))
        ) || null;

        // Also try to find by pattern in all links
        if (!pdfUrl) {
          pdfUrl = links.find((link: string) =>
            link.includes("download") && link.includes("ehealth")
          ) || null;
        }
      }
    }

    // Fallback to known URL
    if (!pdfUrl) {
      pdfUrl = "https://health.ec.europa.eu/document/download/39129f32-710e-412c-89d2-52f9a1f81900_en?filename=ehealth_ehds_qa_en.pdf";
      console.log("Using fallback PDF URL:", pdfUrl);
    } else {
      console.log("Found PDF URL:", pdfUrl);
    }

    // Trigger the parser
    const parseResponse = await fetch(`${supabaseUrl}/functions/v1/parse-ehds-faq`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pdf_url: pdfUrl }),
    });

    const parseResult = await parseResponse.json();
    console.log("Parse result:", parseResult);

    return new Response(JSON.stringify({ success: true, ...parseResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Check updates error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

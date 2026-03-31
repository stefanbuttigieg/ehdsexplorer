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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

  try {
    const body = await req.json();
    const pdfUrl = body.pdf_url || "https://health.ec.europa.eu/document/download/39129f32-710e-412c-89d2-52f9a1f81900_en?filename=ehealth_ehds_qa_en.pdf";
    const dryRun = body.dry_run === true;

    console.log("Downloading PDF from:", pdfUrl);

    // Download PDF
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    const pdfBuffer = await pdfResponse.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    // Compute a simple hash for change detection
    const hashBuffer = await crypto.subtle.digest("SHA-256", pdfBuffer);
    const pdfHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    console.log("PDF hash:", pdfHash, "Size:", pdfBuffer.byteLength);

    // Check if already parsed this version
    const { data: lastLog } = await supabase
      .from("ehds_faq_sync_log")
      .select("pdf_hash")
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastLog?.pdf_hash === pdfHash && !body.force) {
      await supabase.from("ehds_faq_sync_log").insert({
        pdf_url: pdfUrl,
        pdf_hash: pdfHash,
        faqs_parsed: 0,
        footnotes_parsed: 0,
        status: "no_change",
      });
      return new Response(JSON.stringify({ success: true, status: "no_change", message: "PDF unchanged" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use AI to extract FAQs - process in chunks
    const extractionPrompt = `You are extracting structured FAQ data from the European Commission's EHDS FAQ document. The PDF is provided as base64.

Extract ALL FAQs (numbered 1-67) from this document. For each FAQ, extract:
1. faq_number (integer)
2. question (the full question text)
3. answer (plain text summary, max 500 chars)
4. rich_content (full answer in markdown, preserving tables, lists, links, bold text)
5. chapter (the H2-level chapter heading, e.g. "General", "Primary Use (Chapter II)", "Requirements for EHR systems and wellness apps (Chapter III)", "Secondary Use (Chapter IV)", "Governance (Chapter VI)", "International aspects (Chapter V)", "Relationship with other EU law")
6. sub_category (if present, e.g. "For patients", "For health professionals", "For Member States' authorities", "For manufacturers/importers/distributors of EHR systems", "For buyers of EHR systems", "For users of wellness applications", "For data holders", "For data users", "For patients / data subjects", "For health data access bodies (HDABs)")
7. source_articles (array of article numbers referenced in the "Sources:" line, e.g. ["1", "14", "105"])
8. source_references (the full "Sources:" line text)

Also extract footnotes from the document. Each footnote has a number marker and content text.

Return a JSON object with two arrays: "faqs" and "footnotes".
Each footnote should have: marker (string), content (string), and faq_numbers (array of FAQ numbers where this footnote appears).

IMPORTANT: Extract ALL 67 FAQs. Do not skip any. Preserve markdown tables exactly. Include the version history table from the Introduction.`;

    console.log("Calling AI for FAQ extraction...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: extractionPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract all FAQs from this EHDS FAQ PDF document. Return the complete JSON with all 67 FAQs." },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${pdfBase64}` } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 60000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI extraction failed:", aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    let content = aiResult.choices?.[0]?.message?.content || "";

    // Extract JSON from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const extracted = JSON.parse(jsonMatch[1]);
    const faqs = extracted.faqs || [];
    const footnotes = extracted.footnotes || [];

    console.log(`Extracted ${faqs.length} FAQs and ${footnotes.length} footnotes`);

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, status: "dry_run", faqs, footnotes }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert FAQs
    let faqsUpserted = 0;
    for (const faq of faqs) {
      const { error } = await supabase
        .from("ehds_faqs")
        .upsert({
          faq_number: faq.faq_number,
          question: faq.question,
          answer: faq.answer || faq.question,
          rich_content: faq.rich_content || faq.answer,
          chapter: faq.chapter || "General",
          sub_category: faq.sub_category || null,
          source_articles: faq.source_articles || [],
          source_references: faq.source_references || null,
          is_published: true,
          sort_order: faq.faq_number,
          pdf_version: pdfHash.substring(0, 16),
        }, { onConflict: "faq_number" });

      if (error) {
        console.error(`Error upserting FAQ ${faq.faq_number}:`, error);
      } else {
        faqsUpserted++;
      }
    }

    // Get FAQ IDs for footnote linking
    const { data: faqRows } = await supabase
      .from("ehds_faqs")
      .select("id, faq_number");

    const faqIdMap = new Map((faqRows || []).map(r => [r.faq_number, r.id]));

    // Delete old footnotes and insert new ones
    if (faqRows && faqRows.length > 0) {
      await supabase.from("ehds_faq_footnotes").delete().in("faq_id", faqRows.map(r => r.id));
    }

    let footnotesInserted = 0;
    for (const fn of footnotes) {
      const faqNumbers = fn.faq_numbers || [];
      for (const faqNum of faqNumbers) {
        const faqId = faqIdMap.get(faqNum);
        if (faqId) {
          const { error } = await supabase.from("ehds_faq_footnotes").insert({
            faq_id: faqId,
            marker: String(fn.marker),
            content: fn.content,
          });
          if (!error) footnotesInserted++;
        }
      }
    }

    // Log sync
    await supabase.from("ehds_faq_sync_log").insert({
      pdf_url: pdfUrl,
      pdf_hash: pdfHash,
      faqs_parsed: faqsUpserted,
      footnotes_parsed: footnotesInserted,
      status: "success",
    });

    console.log(`Success: ${faqsUpserted} FAQs, ${footnotesInserted} footnotes`);

    return new Response(JSON.stringify({
      success: true,
      status: "success",
      faqs_parsed: faqsUpserted,
      footnotes_parsed: footnotesInserted,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Parse error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    await supabase.from("ehds_faq_sync_log").insert({
      status: "error",
      error_message: msg,
    });

    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

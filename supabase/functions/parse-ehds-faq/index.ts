import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Try to obtain markdown text of the PDF via Firecrawl (preferred when key is available)
async function tryFirecrawlScrape(pdfUrl: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("[firecrawl] No FIRECRAWL_API_KEY — skipping Firecrawl path");
    return null;
  }
  try {
    console.log("[firecrawl] Scraping PDF as markdown:", pdfUrl);
    const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: pdfUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });
    if (!res.ok) {
      console.warn("[firecrawl] Non-OK status:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const md =
      data?.data?.markdown ??
      data?.markdown ??
      data?.data?.content ??
      null;
    if (!md || typeof md !== "string" || md.length < 200) {
      console.warn("[firecrawl] Empty/short markdown returned");
      return null;
    }
    console.log("[firecrawl] Success — markdown length:", md.length);
    return md;
  } catch (e) {
    console.warn("[firecrawl] Error:", e instanceof Error ? e.message : e);
    return null;
  }
}

const EXTRACTION_PROMPT = `You are extracting structured FAQ data from the European Commission's EHDS FAQ document.

Extract ALL FAQs (numbered 1-67). For each FAQ, extract:
1. faq_number (integer)
2. question (the full question text)
3. answer (plain text summary, max 500 chars)
4. rich_content (full answer in markdown, preserving tables, lists, links, bold text)
5. chapter (the H2-level chapter heading)
6. sub_category (if present, e.g. "For patients", "For health professionals", etc.)
7. source_articles (array of article numbers referenced in the "Sources:" line)
8. source_references (the full "Sources:" line text)

Also extract footnotes. Each footnote: marker (string), content (string), faq_numbers (array of FAQ numbers it appears in).

Return a single JSON object: { "faqs": [...], "footnotes": [...] }.
IMPORTANT: Extract ALL 67 FAQs. Preserve markdown tables exactly.`;

async function extractFromMarkdown(markdown: string, lovableKey: string) {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: `Extract all 67 FAQs from this EHDS FAQ markdown. Return complete JSON.\n\n${markdown}` },
      ],
      temperature: 0.1,
      max_tokens: 60000,
    }),
  });
  if (!aiResponse.ok) {
    throw new Error(`AI (markdown) extraction failed: ${aiResponse.status} ${await aiResponse.text()}`);
  }
  return aiResponse.json();
}

async function extractFromPdfBase64(pdfBase64: string, lovableKey: string) {
  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
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
    throw new Error(`AI (pdf) extraction failed: ${aiResponse.status} ${await aiResponse.text()}`);
  }
  return aiResponse.json();
}

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
    const pdfUrl = body.pdf_url || "https://health.ec.europa.eu/document/download/4dd47ec2-71dd-49fc-b036-ad7c14f6ed68_en?filename=ehealth_ehds_qa_en.pdf";
    const dryRun = body.dry_run === true;
    // Allow caller to force a particular path: 'firecrawl' | 'pdf'. Default = auto (firecrawl first, fallback to pdf)
    const preferredMethod: "firecrawl" | "pdf" | "auto" = body.method ?? "auto";

    console.log("Downloading PDF from:", pdfUrl, "method:", preferredMethod);

    // Always download the PDF — needed for hash-based change detection AND as fallback
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    const pdfBuffer = await pdfResponse.arrayBuffer();

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

    // === Extraction with Firecrawl-first strategy ===
    let aiResult: any;
    let methodUsed: "firecrawl" | "pdf" = "pdf";

    if (preferredMethod !== "pdf") {
      const markdown = await tryFirecrawlScrape(pdfUrl);
      if (markdown) {
        try {
          aiResult = await extractFromMarkdown(markdown, LOVABLE_API_KEY);
          methodUsed = "firecrawl";
        } catch (e) {
          console.warn("Firecrawl-markdown extraction failed, falling back to PDF:", e instanceof Error ? e.message : e);
        }
      }
    }

    if (!aiResult) {
      // Fallback: encode PDF to base64 and pass directly to AI
      const bytes = new Uint8Array(pdfBuffer);
      const chunkSize = 32768;
      let pdfBase64 = "";
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        pdfBase64 += String.fromCharCode(...chunk);
      }
      pdfBase64 = btoa(pdfBase64);
      console.log("Calling AI with PDF (fallback path)...");
      aiResult = await extractFromPdfBase64(pdfBase64, LOVABLE_API_KEY);
      methodUsed = "pdf";
    }

    let content = aiResult.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const extracted = JSON.parse(jsonMatch[1]);
    const faqs = extracted.faqs || [];
    const footnotes = extracted.footnotes || [];

    console.log(`Extracted ${faqs.length} FAQs and ${footnotes.length} footnotes via ${methodUsed}`);

    if (dryRun) {
      return new Response(JSON.stringify({ success: true, status: "dry_run", method: methodUsed, faqs, footnotes }), {
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
          rich_content: faq.rich_content && faq.rich_content !== faq.answer ? faq.rich_content : null,
          chapter: faq.chapter || "General",
          sub_category: faq.sub_category || null,
          source_articles: faq.source_articles || [],
          source_recitals: faq.source_recitals || [],
          source_references: faq.source_references || null,
          is_published: true,
          sort_order: faq.faq_number,
          pdf_version: pdfHash.substring(0, 16),
          document_version: body.document_version || null,
        }, { onConflict: "faq_number" });

      if (error) {
        console.error(`Error upserting FAQ ${faq.faq_number}:`, error);
      } else {
        faqsUpserted++;
      }
    }

    // Footnotes
    const { data: faqRows } = await supabase
      .from("ehds_faqs")
      .select("id, faq_number");

    const faqIdMap = new Map((faqRows || []).map(r => [r.faq_number, r.id]));

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

    await supabase.from("ehds_faq_sync_log").insert({
      pdf_url: pdfUrl,
      pdf_hash: pdfHash,
      faqs_parsed: faqsUpserted,
      footnotes_parsed: footnotesInserted,
      status: "success",
      error_message: `method:${methodUsed}`,
    });

    console.log(`Success via ${methodUsed}: ${faqsUpserted} FAQs, ${footnotesInserted} footnotes`);

    return new Response(JSON.stringify({
      success: true,
      status: "success",
      method: methodUsed,
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

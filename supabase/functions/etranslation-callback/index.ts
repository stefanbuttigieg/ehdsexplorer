import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Public callback endpoint invoked by the European Commission's eTranslation
 * service. We correlate the response back to a translation_jobs row using the
 * `ref` query parameter (the job id) we attached to the callback URL when
 * submitting, and fall back to `external-reference` / `request-id` from the
 * payload.
 *
 * Docs: https://language-tools.ec.europa.eu/dev-corner/etranslation/rest-v2/text
 * verify_jwt is set to false because EC does not send a JWT.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const refFromQuery = url.searchParams.get("ref");

    let payload: any = null;
    let translatedText: string | null = null;
    let errorMessage: string | null = null;
    let externalRef: string | null = refFromQuery;
    let ecRequestId: string | null = null;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
      translatedText =
        payload?.["translated-text"] ??
        payload?.translatedText ??
        payload?.["target-text"] ??
        null;
      errorMessage =
        payload?.["error-message"] ??
        payload?.errorMessage ??
        payload?.error ??
        null;
      externalRef =
        externalRef ??
        payload?.["external-reference"] ??
        payload?.externalReference ??
        null;
      ecRequestId = String(
        payload?.["request-id"] ?? payload?.requestId ?? ""
      ) || null;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
      translatedText =
        (form.get("translated-text") as string) ??
        (form.get("target-text") as string) ??
        null;
      errorMessage = (form.get("error-message") as string) ?? null;
      externalRef =
        externalRef ??
        ((form.get("external-reference") as string) || null);
      ecRequestId = ((form.get("request-id") as string) || null);
    } else {
      // Some eTranslation flows POST raw text body with metadata as query string
      const raw = await req.text();
      translatedText = raw;
      payload = { raw };
    }

    console.log("eTranslation callback received", {
      externalRef,
      ecRequestId,
      hasText: !!translatedText,
      errorMessage,
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Locate the job: prefer external-reference (job id), fall back to ec_request_id metadata
    let jobQuery = adminClient.from("translation_jobs").select("*").limit(1);
    if (externalRef) {
      jobQuery = adminClient
        .from("translation_jobs")
        .select("*")
        .eq("id", externalRef)
        .limit(1);
    } else if (ecRequestId) {
      jobQuery = adminClient
        .from("translation_jobs")
        .select("*")
        .eq("metadata->>ec_request_id", ecRequestId)
        .limit(1);
    }

    const { data: jobs, error: findErr } = await jobQuery;
    if (findErr) {
      console.error("Job lookup error", findErr);
    }
    const job = jobs?.[0];

    if (!job) {
      console.warn("No matching translation job found", { externalRef, ecRequestId });
      // Always return 200 so EC does not retry indefinitely
      return new Response(JSON.stringify({ received: true, matched: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isError = !!errorMessage || (translatedText == null);
    const updates: Record<string, unknown> = {
      status: isError ? "failed" : "completed",
      translated_text: translatedText,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
      metadata: {
        ...(job.metadata || {}),
        ec_callback_payload: payload,
      },
    };

    const { error: updateErr } = await adminClient
      .from("translation_jobs")
      .update(updates)
      .eq("id", job.id);

    if (updateErr) {
      console.error("Job update failed", updateErr);
      return new Response(
        JSON.stringify({ received: true, error: updateErr.message }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If this translation targets a UI string, upsert into ui_translations
    if (
      !isError &&
      translatedText &&
      job.target_type === "ui_string" &&
      job.target_id
    ) {
      const { error: uiErr } = await adminClient
        .from("ui_translations")
        .upsert(
          {
            key: job.target_id,
            language_code: job.target_language.toLowerCase(),
            value: translatedText,
            is_ai_generated: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key,language_code" }
        );
      if (uiErr) console.error("ui_translations upsert failed", uiErr);
    }

    return new Response(JSON.stringify({ received: true, jobId: job.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("etranslation-callback error", error);
    // Still return 200 so EC does not retry forever
    return new Response(
      JSON.stringify({
        received: true,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// eTranslation REST v2 endpoint
// Docs: https://language-tools.ec.europa.eu/dev-corner/etranslation/rest-v2/text
const ETRANSLATION_ENDPOINT =
  "https://www.cefat4eu.eu/etranslation/v2/translateText";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const appName = Deno.env.get("ETRANSLATION_APP_NAME");
    const password = Deno.env.get("ETRANSLATION_PASSWORD");
    const callbackUrl = Deno.env.get("ETRANSLATION_CALLBACK_URL");

    if (!appName || !password) {
      return new Response(
        JSON.stringify({ error: "eTranslation credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!callbackUrl) {
      return new Response(
        JSON.stringify({ error: "ETRANSLATION_CALLBACK_URL not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    let userId: string | undefined;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload?.sub;
    } catch {
      userId = undefined;
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: canSubmit, error: roleErr } = await userClient.rpc(
      "is_admin_or_editor",
      { _user_id: userId }
    );
    if (roleErr || !canSubmit) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      text,
      sourceLanguage = "EN",
      targetLanguage,
      domain,
      targetType = "snippet",
      targetId,
      targetField,
      metadata,
    } = body || {};

    if (!text || typeof text !== "string" || !targetLanguage) {
      return new Response(
        JSON.stringify({ error: "text and targetLanguage are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (text.length > 5000) {
      return new Response(
        JSON.stringify({ error: "text exceeds 5000 character limit" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Create job row first so the callback can correlate via external-reference
    const { data: job, error: jobErr } = await adminClient
      .from("translation_jobs")
      .insert({
        source_language: sourceLanguage.toUpperCase(),
        target_language: targetLanguage.toUpperCase(),
        source_text: text,
        target_type: targetType,
        target_id: targetId ?? null,
        target_field: targetField ?? null,
        status: "pending",
        requested_by: userId,
        metadata: metadata ?? {},
      })
      .select()
      .single();

    if (jobErr || !job) {
      console.error("Job insert failed:", jobErr);
      return new Response(
        JSON.stringify({ error: "Failed to create translation job" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build eTranslation REST v2 request
    // The "externalReference" we send is echoed back in the callback so we can find this job.
    const externalReference = job.id;
    const callbackWithRef = `${callbackUrl}?ref=${encodeURIComponent(externalReference)}`;

    const payload: Record<string, unknown> = {
      sourceLanguage: sourceLanguage.toUpperCase(),
      targetLanguages: [targetLanguage.toUpperCase()],
      callerInformation: {
        application: appName,
      },
      textToTranslate: text,
      requesterCallback: callbackWithRef,
      errorCallback: callbackWithRef,
      externalReference,
    };
    if (domain) payload.domain = domain;

    const basicAuth = btoa(`${appName}:${password}`);
    const ecResponse = await fetch(ETRANSLATION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const respText = await ecResponse.text();
    let respJson: unknown = null;
    try {
      respJson = JSON.parse(respText);
    } catch {
      // eTranslation may return a plain numeric request id
    }

    if (!ecResponse.ok) {
      console.error("eTranslation error", ecResponse.status, respText);
      await adminClient
        .from("translation_jobs")
        .update({
          status: "failed",
          error_message: `eTranslation HTTP ${ecResponse.status}: ${respText.slice(0, 500)}`,
        })
        .eq("id", job.id);
      return new Response(
        JSON.stringify({
          error: "eTranslation submission failed",
          status: ecResponse.status,
          details: respText.slice(0, 500),
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the EC request id (positive number = accepted, negative = error code)
    const ecRequestId =
      typeof respJson === "object" && respJson !== null && "request-id" in (respJson as any)
        ? (respJson as any)["request-id"]
        : respText.trim();

    if (typeof ecRequestId === "number" && ecRequestId < 0) {
      // eTranslation returns negative numbers as error codes
      await adminClient
        .from("translation_jobs")
        .update({
          status: "failed",
          error_message: `eTranslation error code: ${ecRequestId}`,
        })
        .eq("id", job.id);
      return new Response(
        JSON.stringify({ error: "eTranslation rejected request", code: ecRequestId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await adminClient
      .from("translation_jobs")
      .update({
        metadata: { ...(job.metadata || {}), ec_request_id: ecRequestId },
      })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({
        success: true,
        jobId: job.id,
        ecRequestId,
        status: "pending",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("etranslation-submit error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
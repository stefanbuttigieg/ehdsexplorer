import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-RateLimit-Remaining, X-RateLimit-Limit",
};

// Rate limit: 10 feedback submissions per hour per IP
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

function getClientIp(req: Request): string {
  // Check various headers for client IP (handles proxies like Cloudflare)
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;

  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    return ips[0];
  }

  return "unknown";
}

async function checkRateLimit(
  supabase: any,
  ipAddress: string,
  actionType: string
): Promise<{ allowed: boolean; remaining: number }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const identifier = `${actionType}:${ipAddress}`;

  // Get current count for this IP and action
  const { data: existing, error: selectError } = await supabase
    .from("api_rate_limits")
    .select("*")
    .eq("ip_address", identifier)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: false })
    .limit(1)
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    console.error("Rate limit check error:", selectError);
    // Allow request on error to avoid blocking legitimate users
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS };
  }

  if (existing) {
    if (existing.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }

    // Increment counter
    await supabase
      .from("api_rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("id", existing.id);

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - existing.request_count - 1,
    };
  }

  // Create new rate limit record
  const { error: insertError } = await supabase.from("api_rate_limits").insert({
    ip_address: identifier,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Rate limit insert error:", insertError);
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIp = getClientIp(req);
    console.log("Processing feedback submission from IP:", clientIp);

    // Check rate limit
    const rateLimit = await checkRateLimit(supabase, clientIp, "feedback");

    if (!rateLimit.allowed) {
      console.log("Rate limit exceeded for IP:", clientIp);
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { translation_id, feedback_type, session_id, comment } = body;

    // Validate required fields
    if (!translation_id || typeof translation_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid translation_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!feedback_type || !["positive", "negative"].includes(feedback_type)) {
      return new Response(
        JSON.stringify({
          error: "Invalid feedback_type. Must be 'positive' or 'negative'",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate session_id if provided
    if (session_id && (typeof session_id !== "string" || session_id.length < 10)) {
      return new Response(
        JSON.stringify({ error: "Invalid session_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate and sanitize comment if provided
    let sanitizedComment: string | null = null;
    if (comment) {
      if (typeof comment !== "string") {
        return new Response(JSON.stringify({ error: "Invalid comment type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Limit comment length and trim
      sanitizedComment = comment.trim().substring(0, 1000) || null;
    }

    // Insert feedback
    const { data, error } = await supabase
      .from("plain_language_feedback")
      .insert({
        translation_id,
        feedback_type,
        session_id: session_id || null,
        comment: sanitizedComment,
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting feedback:", error);
      return new Response(
        JSON.stringify({ error: "Failed to submit feedback" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Feedback submitted successfully:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX_REQUESTS),
        },
      }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

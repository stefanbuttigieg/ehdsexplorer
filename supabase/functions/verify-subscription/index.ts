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
    const { token, type } = await req.json();

    if (!token || typeof token !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid verification token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Handle newsletter subscriptions
    if (type === "newsletter") {
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("verification_token", token)
        .is("unsubscribed_at", null)
        .select("id")
        .single();

      if (error || !data) {
        // Check if already verified
        const { data: existing } = await supabase
          .from("newsletter_subscriptions")
          .select("id, is_verified")
          .eq("verification_token", token)
          .single();

        if (existing?.is_verified) {
          return new Response(
            JSON.stringify({ success: true, already_verified: true }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ error: "This verification link is invalid or has already been used." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, type: "newsletter" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default: implementing act subscriptions
    const { data, error } = await supabase
      .from("implementing_act_subscriptions")
      .update({ verified: true })
      .eq("verification_token", token)
      .select("id")
      .single();

    if (error || !data) {
      // Also try newsletter table as fallback (in case type param was missing)
      const { data: nlData, error: nlError } = await supabase
        .from("newsletter_subscriptions")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("verification_token", token)
        .is("unsubscribed_at", null)
        .select("id")
        .single();

      if (!nlError && nlData) {
        return new Response(
          JSON.stringify({ success: true, type: "newsletter" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "This verification link is invalid or has already been used." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, type: "implementing_act" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Verify subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Something went wrong" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

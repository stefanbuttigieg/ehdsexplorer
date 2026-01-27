import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate unsubscribe token format (UUID format)
const isValidToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(token) && token.length <= 50;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, action = "unsubscribe" } = await req.json();

    // Validate token
    if (!isValidToken(token)) {
      return new Response(
        JSON.stringify({ error: "Invalid unsubscribe token format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action
    const validActions = ["unsubscribe", "get-details"];
    if (!validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to access the table (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "get-details") {
      // Get subscription details for display before unsubscribe
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from("implementing_act_subscriptions")
        .select("email, subscribe_all, implementing_acts(title)")
        .eq("unsubscribe_token", token)
        .single();

      if (fetchError || !subscription) {
        console.error("Subscription fetch error:", fetchError);
        return new Response(
          JSON.stringify({ error: "Subscription not found or already unsubscribed" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Return limited details (not the full email for privacy)
      const maskedEmail = subscription.email.replace(
        /(.{2})(.*)(@.*)/,
        (_: string, start: string, middle: string, end: string) => 
          start + "*".repeat(Math.min(middle.length, 5)) + end
      );

      return new Response(
        JSON.stringify({
          success: true,
          masked_email: maskedEmail,
          subscribe_all: subscription.subscribe_all,
          implementing_act_title: subscription.subscribe_all
            ? "all implementing acts"
            : (subscription.implementing_acts as any)?.title || "an implementing act",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unsubscribe action
    // First get the subscription details for confirmation email
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from("implementing_act_subscriptions")
      .select("email, subscribe_all, implementing_acts(title)")
      .eq("unsubscribe_token", token)
      .single();

    if (fetchError || !subscription) {
      console.error("Subscription fetch error:", fetchError);
      return new Response(
        JSON.stringify({ error: "Subscription not found or already unsubscribed" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete the subscription
    const { error: deleteError } = await supabaseAdmin
      .from("implementing_act_subscriptions")
      .delete()
      .eq("unsubscribe_token", token);

    if (deleteError) {
      console.error("Unsubscribe delete error:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to unsubscribe" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send confirmation email
    const unsubscribedFrom = subscription.subscribe_all
      ? "all"
      : (subscription.implementing_acts as any)?.title || "an implementing act";

    try {
      await supabaseAdmin.functions.invoke("send-unsubscribe-confirmation", {
        body: {
          email: subscription.email,
          unsubscribed_from: unsubscribedFrom,
        },
      });
    } catch (emailError) {
      console.error("Failed to send unsubscribe confirmation email:", emailError);
      // Don't fail the unsubscribe if email fails
    }

    console.log(`Successfully unsubscribed: ${subscription.email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully unsubscribed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Handle unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

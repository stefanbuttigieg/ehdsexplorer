import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, source = "website" } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate source
    const validSources = ["website", "resource_download", "gated_content", "footer", "banner"];
    const safeSource = validSources.includes(source) ? source : "website";

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("newsletter_subscriptions")
      .select("id, is_verified, unsubscribed_at")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.is_verified && !existing.unsubscribed_at) {
        return new Response(
          JSON.stringify({ error: "Email already subscribed", code: "already_subscribed" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Re-subscribe if previously unsubscribed or not verified
      const { error: updateError } = await supabase
        .from("newsletter_subscriptions")
        .update({
          unsubscribed_at: null,
          verification_token: verificationToken,
          is_verified: false,
          source: safeSource,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateError) throw updateError;
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from("newsletter_subscriptions")
        .insert({
          email: email.toLowerCase(),
          source: safeSource,
          verification_token: verificationToken,
          is_verified: false,
        });

      if (insertError) throw insertError;
    }

    // TODO: Send verification email via Resend
    console.log(`Newsletter subscription: ${email} (source: ${safeSource})`);

    return new Response(
      JSON.stringify({ success: true, message: "Subscription pending verification" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

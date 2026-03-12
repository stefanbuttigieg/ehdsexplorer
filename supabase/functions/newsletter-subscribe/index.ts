import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, source = "website" } = await req.json();

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

    const validSources = ["website", "resource_download", "gated_content", "footer", "banner"];
    const safeSource = validSources.includes(source) ? source : "website";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const verificationToken = crypto.randomUUID();

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

    // Send verification email via Resend
    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const verifyUrl = `${baseUrl}/verify-subscription?token=${verificationToken}&type=newsletter`;

    try {
      const emailResponse = await resend.emails.send({
        from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
        to: [email.toLowerCase()],
        subject: "Verify your EHDS Explorer newsletter subscription",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">EHDS Explorer</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Newsletter Subscription</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e40af; margin-top: 0;">Confirm Your Subscription</h2>
              
              <p>Thank you for subscribing to the EHDS Explorer newsletter! You'll receive weekly updates on EHDS implementing acts and regulatory developments.</p>
              
              <p>Please click the button below to verify your email address:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Verify My Email</a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #64748b; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p>If you didn't request this subscription, you can safely ignore this email.</p>
            </div>
          </body>
          </html>
        `,
      });

      if (emailResponse.error) {
        console.error("Resend API error for newsletter verification:", JSON.stringify(emailResponse.error));
      } else {
        console.log(`Newsletter verification email sent to ${email}, ID: ${emailResponse.data?.id}`);
      }
    } catch (emailError) {
      console.error("Failed to send newsletter verification email:", emailError);
    }

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

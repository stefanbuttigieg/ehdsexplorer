import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailOTPRequest {
  action: "send" | "verify";
  code?: string;
}

// Generate a 6-digit OTP code
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP expires after 10 minutes
const OTP_EXPIRY_MINUTES = 10;

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { action, code }: EmailOTPRequest = await req.json();

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (action === "send") {
      // Generate new OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

      // Store OTP in database (hashed for security would be better in production)
      const { error: upsertError } = await supabaseAdmin
        .from("user_mfa_preferences")
        .upsert({
          user_id: user.id,
          email_otp_code: otp,
          email_otp_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Error storing OTP:", upsertError);
        return new Response(
          JSON.stringify({ error: "Failed to generate OTP" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send email with OTP code
      const { error: emailError } = await resend.emails.send({
        from: "EHDS Explorer <noreply@ehdsexplorer.eu>",
        to: [user.email!],
        subject: "Your verification code",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f5;">
            <div style="max-width: 400px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="font-size: 24px; font-weight: 600; color: #18181b; margin: 0 0 16px 0;">Verification Code</h1>
              <p style="font-size: 14px; color: #71717a; margin: 0 0 24px 0;">
                Use the following code to verify your email for two-factor authentication:
              </p>
              <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
                <code style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${otp}</code>
              </div>
              <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
                This code expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error("Error sending email:", emailError);
        return new Response(
          JSON.stringify({ error: "Failed to send verification email" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`OTP sent to ${user.email}`);
      return new Response(
        JSON.stringify({ success: true, message: "Verification code sent" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "verify") {
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Invalid code format" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get stored OTP
      const { data: preferences, error: fetchError } = await supabaseAdmin
        .from("user_mfa_preferences")
        .select("email_otp_code, email_otp_expires_at")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !preferences) {
        console.error("Error fetching OTP:", fetchError);
        return new Response(
          JSON.stringify({ error: "No verification code found. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if OTP is expired
      if (new Date(preferences.email_otp_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: "Verification code has expired. Please request a new one." }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify OTP
      if (preferences.email_otp_code !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Clear OTP and enable email OTP
      const { error: updateError } = await supabaseAdmin
        .from("user_mfa_preferences")
        .update({
          email_otp_enabled: true,
          email_otp_code: null,
          email_otp_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error enabling email OTP:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to enable email verification" }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`Email OTP enabled for user ${user.id}`);
      return new Response(
        JSON.stringify({ success: true, message: "Email verification enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-email-otp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, implementing_act_id, subscribe_all = false } = await req.json();

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert subscription using service role (bypasses RLS)
    const { data, error } = await supabase
      .from("implementing_act_subscriptions")
      .insert({
        email,
        implementing_act_id: subscribe_all ? null : implementing_act_id,
        subscribe_all,
      })
      .select("id, verification_token")
      .single();

    if (error) {
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({ error: "You are already subscribed to this implementing act" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Insert error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to create subscription" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the implementing act title for the email
    let actTitle = "an implementing act";
    if (!subscribe_all && implementing_act_id) {
      const { data: actData } = await supabase
        .from("implementing_acts")
        .select("title")
        .eq("id", implementing_act_id)
        .single();
      if (actData) {
        actTitle = actData.title;
      }
    }

    const subscriptionType = subscribe_all
      ? "all implementing act updates"
      : `updates for "${actTitle}"`;

    // Send verification email directly via Resend (no function-to-function call)
    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const verifyUrl = `${baseUrl}/verify-subscription?token=${data.verification_token}`;

    try {
      const emailResponse = await resend.emails.send({
        from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
        to: [email],
        subject: "Verify your EHDS Explorer subscription",
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
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Verify Your Email Subscription</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e40af; margin-top: 0;">Confirm Your Subscription</h2>
              
              <p>You have subscribed to receive ${subscriptionType} from EHDS Explorer.</p>
              
              <p>Please click the button below to verify your email address and activate your subscription:</p>
              
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
        console.error("Resend API error for subscription verification:", JSON.stringify(emailResponse.error));
      } else {
        console.log(`Verification email sent to ${email}, Resend ID: ${emailResponse.data?.id}`);
      }
    } catch (emailError) {
      console.error("Failed to send verification email to", email, ":", emailError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Please check your email to verify your subscription." }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Subscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process subscription" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

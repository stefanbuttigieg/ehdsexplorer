import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  subscription_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { subscription_id }: VerificationRequest = await req.json();

    if (!subscription_id) {
      console.error("Missing subscription_id");
      return new Response(
        JSON.stringify({ error: "subscription_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending verification email for subscription: ${subscription_id}`);

    // Get subscription details
    const { data: subscription, error: fetchError } = await supabase
      .from("implementing_act_subscriptions")
      .select("email, verification_token, subscribe_all, implementing_act_id, implementing_acts(title)")
      .eq("id", subscription_id)
      .single();

    if (fetchError || !subscription) {
      console.error("Error fetching subscription:", fetchError);
      return new Response(
        JSON.stringify({ error: "Subscription not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const verifyUrl = `${baseUrl}/verify-subscription?token=${subscription.verification_token}`;

    const actTitle = subscription.implementing_acts?.[0]?.title || 'an implementing act';
    const subscriptionType = subscription.subscribe_all 
      ? "all implementing act updates" 
      : `updates for "${actTitle}"`;
    try {
      await resend.emails.send({
        from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
        to: [subscription.email],
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
      console.log(`Verification email sent to ${subscription.email}`);
    } catch (emailError) {
      console.error(`Failed to send verification email:`, emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

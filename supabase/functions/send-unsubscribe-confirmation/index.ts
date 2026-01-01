import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UnsubscribeConfirmRequest {
  email: string;
  unsubscribed_from: string; // "all" or specific act title
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, unsubscribed_from }: UnsubscribeConfirmRequest = await req.json();

    if (!email) {
      console.error("Missing email");
      return new Response(
        JSON.stringify({ error: "email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending unsubscribe confirmation to ${email}`);

    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const subscribeUrl = `${baseUrl}/implementing-acts`;

    const unsubscribedText = unsubscribed_from === "all" 
      ? "all implementing act updates"
      : `updates for "${unsubscribed_from}"`;

    try {
      await resend.emails.send({
        from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
        to: [email],
        subject: "You've been unsubscribed from EHDS Explorer alerts",
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
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Unsubscribe Confirmation</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e40af; margin-top: 0;">You've Been Unsubscribed</h2>
              
              <p>You have successfully unsubscribed from ${unsubscribedText}.</p>
              
              <p>You will no longer receive email notifications for status changes.</p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Changed your mind?</strong></p>
                <p style="margin: 0;">You can always subscribe again to stay updated on implementing act progress.</p>
              </div>
              
              <a href="${subscribeUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">Browse Implementing Acts</a>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p>This is a confirmation of your unsubscribe request.</p>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`Unsubscribe confirmation sent to ${email}`);
    } catch (emailError) {
      console.error(`Failed to send unsubscribe confirmation:`, emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-unsubscribe-confirmation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

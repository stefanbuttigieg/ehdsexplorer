import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusChangeRequest {
  implementing_act_id: string;
  old_status: string;
  new_status: string;
  title: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { implementing_act_id, old_status, new_status, title }: StatusChangeRequest = await req.json();

    console.log(`Status change alert: ${title} changed from ${old_status} to ${new_status}`);

    // Get all verified subscribers for this implementing act or those subscribed to all
    const { data: subscribers, error: fetchError } = await supabase
      .from("implementing_act_subscriptions")
      .select("email, unsubscribe_token")
      .eq("verified", true)
      .or(`implementing_act_id.eq.${implementing_act_id},subscribe_all.eq.true`);

    if (fetchError) {
      console.error("Error fetching subscribers:", fetchError);
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found for this implementing act");
      return new Response(
        JSON.stringify({ message: "No subscribers to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscribers.length} subscribers to notify`);

    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const actUrl = `${baseUrl}/implementing-acts/${implementing_act_id}`;

    // Send emails to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      const unsubscribeUrl = `${baseUrl}/unsubscribe?token=${subscriber.unsubscribe_token}`;
      
      try {
        await resend.emails.send({
          from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
          to: [subscriber.email],
          subject: `EHDS Implementing Act Status Update: ${title}`,
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
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Implementing Act Status Update</p>
              </div>
              
              <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
                <h2 style="color: #1e40af; margin-top: 0;">${title}</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Status changed:</strong></p>
                  <p style="margin: 0;">
                    <span style="background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${old_status}</span>
                    <span style="margin: 0 10px;">→</span>
                    <span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${new_status}</span>
                  </p>
                </div>
                
                <a href="${actUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">View Implementing Act</a>
              </div>
              
              <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                <p>You received this email because you subscribed to updates for this implementing act.</p>
                <p><a href="${unsubscribeUrl}" style="color: #64748b;">Unsubscribe from these alerts</a></p>
              </div>
            </body>
            </html>
          `,
        });
        console.log(`Email sent to ${subscriber.email}`);
        return { email: subscriber.email, success: true };
      } catch (emailError) {
        console.error(`Failed to send email to ${subscriber.email}:`, emailError);
        return { email: subscriber.email, success: false, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;

    console.log(`Successfully sent ${successCount}/${subscribers.length} emails`);

    return new Response(
      JSON.stringify({ 
        message: `Sent ${successCount} notification emails`,
        total: subscribers.length,
        successful: successCount
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

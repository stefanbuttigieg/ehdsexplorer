import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Default template if database fetch fails
const defaultTemplate = {
  subject: "EHDS Explorer - Email Test Successful",
  body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #22c55e;">✓ Email Test Successful</h1>
  <p>Hello {{user_email}},</p>
  <p>This is a test email from EHDS Explorer to verify that email delivery is working correctly.</p>
  <div style="background-color: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0; color: #166534;"><strong>Email Configuration Status:</strong> Working</p>
    <p style="margin: 8px 0 0 0; color: #166534;"><strong>Sent at:</strong> {{sent_at}}</p>
  </div>
  <p>Your Resend integration is configured correctly and emails are being delivered.</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">This is an automated test email from EHDS Explorer.</p>
</div>`,
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Only admins can test email delivery" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recipientEmail = user.email;
    if (!recipientEmail) {
      return new Response(
        JSON.stringify({ error: "No email address found for your account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending test email to ${recipientEmail}`);

    // Fetch email template from database
    let template = defaultTemplate;
    try {
      const { data: templateData, error: templateError } = await supabaseAdmin
        .from("email_templates")
        .select("subject, body_html")
        .eq("id", "test-email")
        .single();

      if (!templateError && templateData) {
        template = templateData;
        console.log("Using custom email template from database");
      } else {
        console.log("Using default email template");
      }
    } catch (err) {
      console.log("Error fetching template, using default:", err);
    }

    // Replace template variables
    const sentAt = new Date().toLocaleString();
    let emailHtml = template.body_html
      .replace(/\{\{user_email\}\}/g, recipientEmail)
      .replace(/\{\{sent_at\}\}/g, sentAt);

    const emailResponse = await resend.emails.send({
      from: "EHDS Explorer <noreply@ehdsexplorer.eu>",
      to: [recipientEmail],
      subject: template.subject,
      html: emailHtml,
    });

    console.log("Email API response:", emailResponse);

    if (emailResponse.error) {
      console.error("Email error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: emailResponse.error.message || "Email sending failed",
          details: emailResponse.error
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${recipientEmail}`,
        emailId: emailResponse.data?.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in test-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role: "admin" | "editor";
  inviterEmail: string;
}

// Default template if database fetch fails
const defaultTemplate = {
  subject: "You've been invited to EHDS Explorer Admin",
  body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #0ea5e9;">Welcome to EHDS Explorer</h1>
  <p>Hello,</p>
  <p>You have been invited to join the EHDS Explorer administration team as an <strong>{{role}}</strong>.</p>
  <p>Click the button below to set up your account:</p>
  <div style="text-align: center; margin: 30px 0;">
    <a href="{{login_url}}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Up Your Account</a>
  </div>
  <p>If the button doesn't work, copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">{{login_url}}</p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  <p style="color: #999; font-size: 12px;">This invitation was sent by {{inviter_email}}. If you didn't expect this invitation, you can safely ignore this email.</p>
</div>`,
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user is an admin
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

    // Check if user is admin using service role
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
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can send invitations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, inviterEmail }: InviteRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the site URL for the login link
    const siteUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";

    console.log(`Sending invitation to ${email} for role ${role}`);

    // Fetch email template from database
    let template = defaultTemplate;
    try {
      const { data: templateData, error: templateError } = await supabaseAdmin
        .from("email_templates")
        .select("subject, body_html")
        .eq("id", "user-invitation")
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
    let emailHtml = template.body_html
      .replace(/\{\{role\}\}/g, role)
      .replace(/\{\{login_url\}\}/g, `${siteUrl}/admin/auth`)
      .replace(/\{\{inviter_email\}\}/g, inviterEmail);

    // First, create the invitation record
    const { data: invitation, error: inviteInsertError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        email: email.toLowerCase().trim(),
        role,
        status: "pending",
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteInsertError) {
      console.error("Failed to create invitation record:", inviteInsertError);
      return new Response(
        JSON.stringify({ error: "Failed to create invitation record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to send the email
    let emailStatus = "sent";
    let errorMessage = null;

    try {
      const emailResponse = await resend.emails.send({
        from: "EHDS Explorer <noreply@ehdsexplorer.eu>",
        to: [email],
        subject: template.subject,
        html: emailHtml,
      });

      console.log("Email API response:", emailResponse);

      // Check if there was an error in the response
      if (emailResponse.error) {
        emailStatus = "failed";
        errorMessage = emailResponse.error.message || "Email sending failed";
        console.error("Email sending error:", emailResponse.error);
      }
    } catch (emailError: any) {
      emailStatus = "failed";
      errorMessage = emailError.message || "Email sending failed";
      console.error("Email sending exception:", emailError);
    }

    // Update the invitation status
    await supabaseAdmin
      .from("user_invitations")
      .update({
        status: emailStatus,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (emailStatus === "failed") {
      return new Response(
        JSON.stringify({ 
          success: false, 
          invitationId: invitation.id,
          error: errorMessage,
          message: "Invitation created but email delivery failed. This is likely due to Resend domain verification. Please verify your domain at resend.com/domains."
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        message: "Invitation sent successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

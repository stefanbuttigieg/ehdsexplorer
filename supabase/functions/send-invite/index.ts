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
        from: "EHDS Explorer <onboarding@resend.dev>",
        to: [email],
        subject: "You've been invited to EHDS Explorer Admin",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">EHDS Explorer</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                <h2 style="color: #1f2937; margin-top: 0;">You've been invited!</h2>
                <p style="color: #4b5563;">
                  <strong>${inviterEmail}</strong> has invited you to join the EHDS Explorer admin team as an <strong>${role}</strong>.
                </p>
                <p style="color: #4b5563;">
                  ${role === "admin" 
                    ? "As an admin, you'll have full access to manage all content, users, and settings."
                    : "As an editor, you'll be able to manage articles, recitals, definitions, and other content."}
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${siteUrl}/admin/auth" 
                     style="background: #0ea5e9; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                    Sign Up Now
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">
                  Click the button above to create your account and get started.
                </p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="color: #9ca3af; font-size: 12px; margin-bottom: 0;">
                  This invitation was sent by the EHDS Explorer team. If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
            </body>
          </html>
        `,
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

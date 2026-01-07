import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResendConfirmationRequest {
  userId: string;
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

    // Verify the caller is authenticated and is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the calling user's session
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: callingUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !callingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if calling user is an admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .in("role", ["admin", "super_admin"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("User is not an admin:", callingUser.id);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { userId }: ResendConfirmationRequest = await req.json();

    if (!userId) {
      console.error("Missing userId");
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Resending confirmation email for user: ${userId}`);

    // Get the user details
    const { data: { user: targetUser }, error: getUserError } = await supabase.auth.admin.getUserById(userId);

    if (getUserError || !targetUser) {
      console.error("Error getting user:", getUserError);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!targetUser.email) {
      console.error("User has no email");
      return new Response(
        JSON.stringify({ error: "User has no email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is already confirmed
    if (targetUser.email_confirmed_at) {
      console.log("User email already confirmed:", targetUser.email);
      return new Response(
        JSON.stringify({ 
          success: false, 
          already_confirmed: true,
          message: "This user's email is already confirmed" 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate a magic link for email confirmation
    const baseUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: targetUser.email,
      options: {
        redirectTo: `${baseUrl}/admin`,
      },
    });

    if (linkError) {
      console.error("Error generating confirmation link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate confirmation link", details: linkError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the confirmation link from the response
    const confirmationUrl = linkData?.properties?.action_link;
    if (!confirmationUrl) {
      console.error("No confirmation link generated");
      return new Response(
        JSON.stringify({ error: "Failed to generate confirmation link" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the confirmation email via Resend
    try {
      await resend.emails.send({
        from: "EHDS Explorer <notifications@ehdsexplorer.eu>",
        to: [targetUser.email],
        subject: "Confirm your EHDS Explorer account",
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
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Confirm Your Email Address</p>
            </div>
            
            <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #1e40af; margin-top: 0;">Welcome to EHDS Explorer</h2>
              
              <p>Please click the button below to confirm your email address and activate your account:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${confirmationUrl}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">Confirm My Email</a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="color: #64748b; font-size: 12px; word-break: break-all;">${confirmationUrl}</p>
            </div>
            
            <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
              <p>If you didn't create an account, you can safely ignore this email.</p>
            </div>
          </body>
          </html>
        `,
      });
      console.log(`Confirmation email sent to ${targetUser.email}`);
    } catch (emailError) {
      console.error(`Failed to send confirmation email:`, emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Confirmation email sent to ${targetUser.email}` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in resend-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

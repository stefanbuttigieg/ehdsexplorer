import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

// Email validation function
const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
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

    // Check if user is admin using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can send invitations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, inviterEmail }: InviteRequest = await req.json();

    // Validate required fields
    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email and role are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate role against allowed values
    const VALID_ROLES: Array<"admin" | "editor"> = ["admin", "editor"];
    if (!VALID_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role: must be 'admin' or 'editor'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inviterEmail format and length if provided
    if (inviterEmail) {
      if (!isValidEmail(inviterEmail)) {
        return new Response(
          JSON.stringify({ error: "Invalid inviter email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (inviterEmail.length > 254) {
        return new Response(
          JSON.stringify({ error: "Inviter email too long" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://ehdsexplorer.eu";
    const normalizedEmail = email.toLowerCase().trim();

    console.log(`Creating invitation for ${normalizedEmail} with role ${role}`);

    // Create the invitation record first
    const { data: invitation, error: inviteInsertError } = await supabaseAdmin
      .from("user_invitations")
      .insert({
        email: normalizedEmail,
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

    // Use Supabase Admin API to invite user - this works even when signups are disabled
    // Redirect to set-password page so users can set their password after clicking the magic link
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      normalizedEmail,
      {
        redirectTo: `${siteUrl}/admin/set-password`,
        data: {
          role: role,
          invited_by: inviterEmail,
        }
      }
    );

    if (inviteError) {
      console.error("Failed to invite user:", inviteError);
      
      // Update invitation status to failed
      await supabaseAdmin
        .from("user_invitations")
        .update({
          status: "failed",
          error_message: inviteError.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      // Check if user already exists
      if (inviteError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            invitationId: invitation.id,
            error: "This email is already registered. You can assign them a role directly.",
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          invitationId: invitation.id,
          error: inviteError.message,
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("User invited successfully:", inviteData);

    // Pre-create the user role so it's ready when they accept
    if (inviteData.user) {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: inviteData.user.id,
          role: role,
        });

      if (roleInsertError) {
        console.error("Failed to pre-create role:", roleInsertError);
        // Don't fail the invitation, the role can be added manually
      } else {
        console.log(`Pre-created ${role} role for user ${inviteData.user.id}`);
      }
    }

    // Update invitation status to sent
    await supabaseAdmin
      .from("user_invitations")
      .update({
        status: "sent",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        message: "Invitation sent successfully. The user will receive an email with a magic link to set up their account." 
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

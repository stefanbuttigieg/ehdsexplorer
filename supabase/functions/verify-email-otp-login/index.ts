 import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
 import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers":
     "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 interface VerifyRequest {
   code: string;
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
 
     const { code }: VerifyRequest = await req.json();
 
     if (!code || code.length !== 6) {
       return new Response(
         JSON.stringify({ error: "Invalid code format" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Use service role client for database operations
     const supabaseAdmin = createClient(
       Deno.env.get("SUPABASE_URL") ?? "",
       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
     );
 
     // Get stored OTP and check if email OTP is enabled
     const { data: preferences, error: fetchError } = await supabaseAdmin
       .from("user_mfa_preferences")
       .select("email_otp_code, email_otp_expires_at, email_otp_enabled")
       .eq("user_id", user.id)
       .single();
 
     if (fetchError || !preferences) {
       console.error("Error fetching OTP:", fetchError);
       return new Response(
         JSON.stringify({ error: "No verification code found. Please request a new one." }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Check if email OTP is enabled for this user
     if (!preferences.email_otp_enabled) {
       return new Response(
         JSON.stringify({ error: "Email verification is not enabled for this account" }),
         { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
       );
     }
 
     // Check if no code exists
     if (!preferences.email_otp_code || !preferences.email_otp_expires_at) {
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
 
     // Clear OTP after successful verification (but don't disable email OTP)
     const { error: updateError } = await supabaseAdmin
       .from("user_mfa_preferences")
       .update({
         email_otp_code: null,
         email_otp_expires_at: null,
         updated_at: new Date().toISOString(),
       })
       .eq("user_id", user.id);
 
     if (updateError) {
       console.error("Error clearing OTP:", updateError);
       // Don't fail the verification, just log the error
     }
 
     console.log(`Email OTP verified for login - user ${user.id}`);
     return new Response(
       JSON.stringify({ success: true, message: "Email verification successful" }),
       { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   } catch (error: any) {
     console.error("Error in verify-email-otp-login:", error);
     return new Response(
       JSON.stringify({ error: error.message }),
       { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
     );
   }
 });
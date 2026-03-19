import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple IP-to-country using ip-api.com (free, no key needed)
async function detectCountry(ip: string): Promise<{ code: string; name: string } | null> {
  // Skip local/private IPs
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    return null;
  }

  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,country`);
    const data = await res.json();
    if (data.status === "success") {
      return { code: data.countryCode, name: data.country };
    }
  } catch {
    // fallback
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, points = 1, source_detail, country_code, country_name } = await req.json();

    if (!category) {
      return new Response(JSON.stringify({ error: "category is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const validCategories = ["reading", "games", "exploration", "achievements"];
    if (!validCategories.includes(category)) {
      return new Response(JSON.stringify({ error: "Invalid category" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user info from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // Determine country - prefer client-provided, fallback to IP detection
    let finalCountryCode = country_code;
    let finalCountryName = country_name;

    if (!finalCountryCode) {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-real-ip") ||
        "";

      const geo = await detectCountry(ip);
      if (geo) {
        finalCountryCode = geo.code;
        finalCountryName = geo.name;
      } else {
        finalCountryCode = "XX";
        finalCountryName = "Unknown";
      }
    }

    // Generate a session ID for anonymous users
    const sessionId = userId ? null : crypto.randomUUID();

    const { error } = await supabase.from("leaderboard_contributions").insert({
      user_id: userId,
      session_id: sessionId,
      country_code: finalCountryCode,
      country_name: finalCountryName,
      category,
      points: Math.min(Math.max(1, points), 100), // clamp 1-100
      source_detail: source_detail?.substring(0, 200) ?? null,
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, country: finalCountryCode }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

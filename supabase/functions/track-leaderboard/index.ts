import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[0-9a-fA-F:]{2,39}$/;
const isPublicIp = (ip: string) =>
  (IPV4.test(ip) && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|0\.)/.test(ip)) ||
  (IPV6.test(ip) && ip.includes(':') && !/^(::1$|fc|fd|fe80)/i.test(ip));

// IP-to-country lookup for the caller's own, validated public address only.
async function detectCountry(ip: string): Promise<{ code: string; name: string } | null> {
  if (!isPublicIp(ip)) return null;
  try {
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,countryCode,country`);
    const data = await res.json();
    if (data.status === "success" && /^[A-Z]{2}$/.test(data.countryCode)) {
      return { code: data.countryCode, name: String(data.country).slice(0, 80) };
    }
  } catch {
    // fallback
  }
  return null;
}

const HOURLY_LIMIT = 60;
async function withinRateLimit(supabase: any, ip: string): Promise<boolean> {
  const id = `leaderboard:${ip || "unknown"}`;
  const since = new Date(Date.now() - 3600_000).toISOString();
  const { data } = await supabase.from("api_rate_limits").select("id, request_count")
    .eq("ip_address", id).gte("window_start", since).order("window_start", { ascending: false }).limit(1).maybeSingle();
  if (data) {
    if (data.request_count >= HOURLY_LIMIT) return false;
    await supabase.from("api_rate_limits").update({ request_count: data.request_count + 1 }).eq("id", data.id);
    return true;
  }
  await supabase.from("api_rate_limits").insert({ ip_address: id, request_count: 1, window_start: new Date().toISOString() });
  return true;
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

    const ip = (req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "").trim();
    // Get user info from auth header if available
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    if (!(await withinRateLimit(supabase, ip))) {
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (authHeader) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // Determine country - prefer client-provided, fallback to IP detection
    let finalCountryCode = typeof country_code === "string" && /^[A-Z]{2}$/.test(country_code) ? country_code : undefined;
    let finalCountryName = finalCountryCode ? String(country_name ?? finalCountryCode).slice(0, 80) : undefined;

    if (!finalCountryCode) {
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
      points: Math.min(Math.max(1, Math.floor(Number(points) || 1)), 100), // clamp 1-100
      source_detail: typeof source_detail === "string" ? source_detail.substring(0, 200) : null,
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

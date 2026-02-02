import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiToken = Deno.env.get("UMAMI_API_TOKEN");
    const websiteId = Deno.env.get("VITE_UMAMI_WEBSITE_ID");
    
    if (!apiToken || !websiteId) {
      console.log("Missing Umami configuration", { hasToken: !!apiToken, hasWebsiteId: !!websiteId });
      return new Response(
        JSON.stringify({ 
          error: "Umami not configured",
          configured: false 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Helper to extract stat values - Umami API returns { pageviews: 5 } not { pageviews: { value: 5 } }
    const extractStats = (stats: unknown) => {
      if (!stats || typeof stats !== 'object') {
        return { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 };
      }
      const s = stats as Record<string, unknown>;
      return {
        pageviews: typeof s.pageviews === 'object' && s.pageviews !== null 
          ? ((s.pageviews as Record<string, number>).value ?? 0)
          : (typeof s.pageviews === 'number' ? s.pageviews : 0),
        visitors: typeof s.visitors === 'object' && s.visitors !== null 
          ? ((s.visitors as Record<string, number>).value ?? 0)
          : (typeof s.visitors === 'number' ? s.visitors : 0),
        visits: typeof s.visits === 'object' && s.visits !== null 
          ? ((s.visits as Record<string, number>).value ?? 0)
          : (typeof s.visits === 'number' ? s.visits : 0),
        bounces: typeof s.bounces === 'object' && s.bounces !== null 
          ? ((s.bounces as Record<string, number>).value ?? 0)
          : (typeof s.bounces === 'number' ? s.bounces : 0),
        totaltime: typeof s.totaltime === 'object' && s.totaltime !== null 
          ? ((s.totaltime as Record<string, number>).value ?? 0)
          : (typeof s.totaltime === 'number' ? s.totaltime : 0),
      };
    };

    // Helper to safely fetch with error handling
    const safeFetch = async (url: string, label: string) => {
      try {
        const response = await fetch(url, {
          headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`${label} failed with status ${response.status}: ${errorText}`);
          return null;
        }
        
        const text = await response.text();
        if (!text) {
          console.error(`${label} returned empty response`);
          return null;
        }
        
        return JSON.parse(text);
      } catch (e) {
        console.error(`Error fetching ${label}:`, e);
        return null;
      }
    };

    // Get stats for different periods
    const [todayStats, weekStats, monthStats, activeVisitors] = await Promise.all([
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfDay.getTime()}&endAt=${now.getTime()}`, "today stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}`, "week stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfMonth.getTime()}&endAt=${now.getTime()}`, "month stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/active`, "active visitors")
    ]);

    // Get pageviews data for chart (last 7 days)
    const pageviewsData = await safeFetch(
      `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}&unit=day`,
      "pageviews"
    );

    // Get top pages
    const topPages = await safeFetch(
      `https://api.umami.is/v1/websites/${websiteId}/metrics?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}&type=url`,
      "top pages"
    );

    console.log("Umami API raw responses:", JSON.stringify({ todayStats, weekStats, monthStats, activeVisitors }));

    return new Response(
      JSON.stringify({
        configured: true,
        today: extractStats(todayStats),
        week: extractStats(weekStats),
        month: extractStats(monthStats),
        activeVisitors: typeof activeVisitors === 'object' && activeVisitors !== null 
          ? (activeVisitors.x ?? activeVisitors.visitors ?? 0) 
          : 0,
        pageviewsChart: pageviewsData?.pageviews ?? [],
        sessionsChart: pageviewsData?.sessions ?? [],
        topPages: (topPages ?? []).slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-umami-analytics:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, configured: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

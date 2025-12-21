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

    // Get stats for different periods
    const [todayStats, weekStats, monthStats, activeVisitors] = await Promise.all([
      // Today's stats
      fetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfDay.getTime()}&endAt=${now.getTime()}`, {
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
      }).then(r => r.json()).catch(e => {
        console.error("Error fetching today stats:", e);
        return null;
      }),
      
      // Last 7 days stats
      fetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}`, {
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
      }).then(r => r.json()).catch(e => {
        console.error("Error fetching week stats:", e);
        return null;
      }),
      
      // This month stats
      fetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfMonth.getTime()}&endAt=${now.getTime()}`, {
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
      }).then(r => r.json()).catch(e => {
        console.error("Error fetching month stats:", e);
        return null;
      }),
      
      // Active visitors (real-time)
      fetch(`https://api.umami.is/v1/websites/${websiteId}/active`, {
        headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
      }).then(r => r.json()).catch(e => {
        console.error("Error fetching active visitors:", e);
        return null;
      })
    ]);

    // Get pageviews data for chart (last 7 days)
    const pageviewsData = await fetch(
      `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}&unit=day`,
      { headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" } }
    ).then(r => r.json()).catch(e => {
      console.error("Error fetching pageviews:", e);
      return null;
    });

    // Get top pages
    const topPages = await fetch(
      `https://api.umami.is/v1/websites/${websiteId}/metrics?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}&type=url`,
      { headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" } }
    ).then(r => r.json()).catch(e => {
      console.error("Error fetching top pages:", e);
      return null;
    });

    console.log("Umami API responses:", { 
      todayStats, 
      weekStats, 
      monthStats, 
      activeVisitors,
      pageviewsData: pageviewsData ? "received" : "error",
      topPages: topPages ? `${topPages.length || 0} pages` : "error"
    });

    return new Response(
      JSON.stringify({
        configured: true,
        today: {
          pageviews: todayStats?.pageviews?.value ?? 0,
          visitors: todayStats?.visitors?.value ?? 0,
          visits: todayStats?.visits?.value ?? 0,
          bounces: todayStats?.bounces?.value ?? 0,
          totaltime: todayStats?.totaltime?.value ?? 0,
        },
        week: {
          pageviews: weekStats?.pageviews?.value ?? 0,
          visitors: weekStats?.visitors?.value ?? 0,
          visits: weekStats?.visits?.value ?? 0,
          bounces: weekStats?.bounces?.value ?? 0,
          totaltime: weekStats?.totaltime?.value ?? 0,
        },
        month: {
          pageviews: monthStats?.pageviews?.value ?? 0,
          visitors: monthStats?.visitors?.value ?? 0,
          visits: monthStats?.visits?.value ?? 0,
          bounces: monthStats?.bounces?.value ?? 0,
          totaltime: monthStats?.totaltime?.value ?? 0,
        },
        activeVisitors: activeVisitors?.x ?? 0,
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

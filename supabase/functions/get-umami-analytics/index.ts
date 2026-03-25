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
      return new Response(
        JSON.stringify({ error: "Umami not configured", configured: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse optional custom date range from request body
    let customStartAt: number | null = null;
    let customEndAt: number | null = null;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.startAt) customStartAt = body.startAt;
        if (body.endAt) customEndAt = body.endAt;
      } catch { /* ignore parse errors, use defaults */ }
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Custom range defaults to last 7 days if not provided
    const rangeStart = customStartAt ?? startOfWeek.getTime();
    const rangeEnd = customEndAt ?? now.getTime();

    const extractStats = (stats: unknown) => {
      if (!stats || typeof stats !== 'object') {
        return { pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 };
      }
      const s = stats as Record<string, unknown>;
      const extract = (key: string) => {
        const v = s[key];
        if (typeof v === 'object' && v !== null) return ((v as Record<string, number>).value ?? 0);
        return typeof v === 'number' ? v : 0;
      };
      return {
        pageviews: extract('pageviews'),
        visitors: extract('visitors'),
        visits: extract('visits'),
        bounces: extract('bounces'),
        totaltime: extract('totaltime'),
      };
    };

    const safeFetch = async (url: string, label: string) => {
      try {
        const response = await fetch(url, {
          headers: { "Authorization": `Bearer ${apiToken}`, "Content-Type": "application/json" }
        });
        if (!response.ok) {
          console.error(`${label} failed: ${response.status}`);
          return null;
        }
        const text = await response.text();
        if (!text) return null;
        return JSON.parse(text);
      } catch (e) {
        console.error(`Error fetching ${label}:`, e);
        return null;
      }
    };

    // Determine appropriate unit for chart based on range size
    const rangeDays = (rangeEnd - rangeStart) / (1000 * 60 * 60 * 24);
    const unit = rangeDays > 90 ? 'month' : rangeDays > 14 ? 'week' : 'day';

    const [todayStats, weekStats, monthStats, activeVisitors, rangeStats] = await Promise.all([
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfDay.getTime()}&endAt=${now.getTime()}`, "today stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfWeek.getTime()}&endAt=${now.getTime()}`, "week stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startOfMonth.getTime()}&endAt=${now.getTime()}`, "month stats"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/active`, "active visitors"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${rangeStart}&endAt=${rangeEnd}`, "custom range stats"),
    ]);

    const [pageviewsData, topPages] = await Promise.all([
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${rangeStart}&endAt=${rangeEnd}&unit=${unit}`, "pageviews"),
      safeFetch(`https://api.umami.is/v1/websites/${websiteId}/metrics?startAt=${rangeStart}&endAt=${rangeEnd}&type=url`, "top pages"),
    ]);

    return new Response(
      JSON.stringify({
        configured: true,
        today: extractStats(todayStats),
        week: extractStats(weekStats),
        month: extractStats(monthStats),
        custom: extractStats(rangeStats),
        activeVisitors: typeof activeVisitors === 'object' && activeVisitors !== null
          ? (activeVisitors.x ?? activeVisitors.visitors ?? 0) : 0,
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

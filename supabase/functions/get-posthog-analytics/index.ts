import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_PROJECT_ID_PLACEHOLDER = "current"; // uses personal API key scoped project

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("POSTHOG_PERSONAL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "PostHog not configured", configured: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let startDate = "";
    let endDate = "";

    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.startDate) startDate = body.startDate;
        if (body.endDate) endDate = body.endDate;
      } catch { /* ignore */ }
    }

    // Default to last 7 days
    if (!startDate) {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      startDate = d.toISOString().split("T")[0];
    }
    if (!endDate) {
      endDate = new Date().toISOString().split("T")[0];
    }

    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    };

    const safeFetch = async (url: string, label: string, options?: RequestInit) => {
      try {
        const response = await fetch(url, { headers, ...options });
        if (!response.ok) {
          const text = await response.text();
          console.error(`${label} failed: ${response.status} - ${text}`);
          return null;
        }
        return await response.json();
      } catch (e) {
        console.error(`Error fetching ${label}:`, e);
        return null;
      }
    };

    // Use the Query endpoint for trends
    const trendsQuery = {
      query: {
        kind: "TrendsQuery",
        series: [
          { event: "$pageview", kind: "EventsNode", math: "total" },
          { event: "$pageleave", kind: "EventsNode", math: "total" },
        ],
        dateRange: { date_from: startDate, date_to: endDate },
        interval: "day",
      }
    };

    const topEventsQuery = {
      query: {
        kind: "TrendsQuery",
        series: [
          { event: null, kind: "EventsNode", math: "total" },
        ],
        dateRange: { date_from: startDate, date_to: endDate },
        breakdownFilter: { breakdown: "$event_type", breakdown_type: "event" },
      }
    };

    const baseUrl = `${POSTHOG_HOST}/api/environments/${POSTHOG_PROJECT_ID_PLACEHOLDER}`;

    // Fetch trends and insights in parallel
    const [trendsData, eventsData, personsData] = await Promise.all([
      safeFetch(`${baseUrl}/query/`, "trends", {
        method: "POST",
        body: JSON.stringify(trendsQuery),
      }),
      // Get recent events summary
      safeFetch(`${baseUrl}/events/?limit=100&after=${startDate}T00:00:00Z&before=${endDate}T23:59:59Z`, "events"),
      // Get persons count
      safeFetch(`${baseUrl}/persons/?limit=1`, "persons"),
    ]);

    // Process event counts by type
    const eventCounts: Record<string, number> = {};
    if (eventsData?.results) {
      for (const event of eventsData.results) {
        const name = event.event || "unknown";
        eventCounts[name] = (eventCounts[name] || 0) + 1;
      }
    }

    const topEvents = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Extract trends data
    const trendsSeries = trendsData?.results || [];
    const pageviewTrend = trendsSeries[0] || null;
    const pageLeaveTrend = trendsSeries[1] || null;

    return new Response(
      JSON.stringify({
        configured: true,
        trends: {
          pageviews: pageviewTrend ? {
            labels: pageviewTrend.labels || [],
            data: pageviewTrend.data || [],
            count: pageviewTrend.count || 0,
          } : null,
          pageLeaves: pageLeaveTrend ? {
            labels: pageLeaveTrend.labels || [],
            data: pageLeaveTrend.data || [],
            count: pageLeaveTrend.count || 0,
          } : null,
        },
        topEvents,
        totalPersons: personsData?.count ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-posthog-analytics:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, configured: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

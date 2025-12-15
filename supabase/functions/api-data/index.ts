import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "public, max-age=300", // 5 min cache for public data
};

// Allowed resources - whitelist approach
const ALLOWED_RESOURCES = ["articles", "recitals", "definitions", "chapters", "implementing-acts", "metadata"];
const ALLOWED_FORMATS = ["json", "csv"];

// Rate limiting config: 100 requests per hour per IP
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Validate and sanitize ID parameter
function validateId(id: string | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 10000) return null;
  return parsed;
}

// Get client IP from request headers
function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         "unknown";
}

// Check and update rate limit
async function checkRateLimit(supabase: any, ip: string): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);
  
  // Clean up old entries and get current count
  await supabase
    .from("api_rate_limits")
    .delete()
    .lt("window_start", windowStart.toISOString());
  
  // Get current request count for this IP
  const { data: existing } = await supabase
    .from("api_rate_limits")
    .select("id, request_count, window_start")
    .eq("ip_address", ip)
    .gte("window_start", windowStart.toISOString())
    .maybeSingle();
  
  if (existing) {
    const newCount = existing.request_count + 1;
    if (newCount > RATE_LIMIT_MAX) {
      const resetAt = new Date(new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW_MS);
      return { allowed: false, remaining: 0, resetAt };
    }
    
    await supabase
      .from("api_rate_limits")
      .update({ request_count: newCount })
      .eq("id", existing.id);
    
    return { allowed: true, remaining: RATE_LIMIT_MAX - newCount, resetAt: new Date(new Date(existing.window_start).getTime() + RATE_LIMIT_WINDOW_MS) };
  } else {
    // First request from this IP in the window
    await supabase
      .from("api_rate_limits")
      .insert({ ip_address: ip, request_count: 1, window_start: now.toISOString() });
    
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) };
  }
}

Deno.serve(async (req) => {
  // Only allow GET requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Use service role for controlled data access - bypasses RLS but we explicitly select only public columns
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Check rate limit
    const clientIp = getClientIp(req);
    const rateLimit = await checkRateLimit(supabase, clientIp);
    
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
            "Retry-After": String(Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000))
          }
        }
      );
    }

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");
    const format = url.searchParams.get("format") || "json";
    const id = url.searchParams.get("id");

    // Validate resource parameter
    if (resource && !ALLOWED_RESOURCES.includes(resource)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid resource",
          allowedResources: ALLOWED_RESOURCES 
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate format parameter
    if (!ALLOWED_FORMATS.includes(format)) {
      return new Response(
        JSON.stringify({ error: "Invalid format. Use 'json' or 'csv'" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate ID if provided
    const validatedId = validateId(id);

    console.log(`API request: resource=${resource}, format=${format}, id=${validatedId}`);

    let data: any = null;
    let error: any = null;

    switch (resource) {
      case "articles":
        if (validatedId) {
          const result = await supabase
            .from("articles")
            .select("article_number, title, content, chapter_id, section_id")
            .eq("article_number", validatedId)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("articles")
            .select("article_number, title, content, chapter_id, section_id")
            .order("article_number", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;

      case "recitals":
        if (validatedId) {
          const result = await supabase
            .from("recitals")
            .select("recital_number, content, related_articles")
            .eq("recital_number", validatedId)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase
            .from("recitals")
            .select("recital_number, content, related_articles")
            .order("recital_number", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;

      case "definitions":
        const defsResult = await supabase
          .from("definitions")
          .select("term, definition, source_article")
          .order("term", { ascending: true });
        data = defsResult.data;
        error = defsResult.error;
        break;

      case "chapters":
        const chaptersResult = await supabase
          .from("chapters")
          .select("chapter_number, title, description")
          .order("chapter_number", { ascending: true });
        data = chaptersResult.data;
        error = chaptersResult.error;
        break;

      case "implementing-acts":
        const actsResult = await supabase
          .from("implementing_acts")
          .select("id, title, description, type, theme, status, article_reference, related_articles, feedback_deadline")
          .order("title", { ascending: true });
        data = actsResult.data;
        error = actsResult.error;
        break;

      case "metadata":
        data = {
          regulation: {
            title: "Regulation (EU) 2025/327 - European Health Data Space",
            shortTitle: "EHDS Regulation",
            celex: "32025R0327",
            eli: "http://data.europa.eu/eli/reg/2025/327",
            eurLex: "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32025R0327",
            datePublished: "2025-01-22",
            inForce: true,
          },
          api: {
            version: "1.0",
            endpoints: [
              { resource: "articles", description: "All articles of the EHDS Regulation" },
              { resource: "recitals", description: "All recitals of the EHDS Regulation" },
              { resource: "definitions", description: "Defined terms from Article 2" },
              { resource: "chapters", description: "Chapter structure" },
              { resource: "implementing-acts", description: "Implementing and delegated acts" },
            ],
            formats: ["json", "csv"],
          },
          license: "MIT",
          source: "https://github.com/stefanbuttigieg/ehdsexplorer",
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid resource",
            availableResources: ["articles", "recitals", "definitions", "chapters", "implementing-acts", "metadata"],
            usage: "?resource=articles&format=json&id=1",
          }),
          { status: 400, headers: corsHeaders }
        );
    }

    if (error) {
      // Log internally but don't expose details to client
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Unable to retrieve data" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Add FAIR metadata wrapper
    const response = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `EHDS Regulation - ${resource}`,
      description: `${resource} from Regulation (EU) 2025/327 - European Health Data Space`,
      license: "https://opensource.org/licenses/MIT",
      identifier: `ehds-explorer-${resource}`,
      dateModified: new Date().toISOString(),
      publisher: {
        "@type": "Organization",
        name: "EHDS Explorer",
        url: "https://ehdsexplorer.eu",
      },
      isPartOf: {
        "@type": "Legislation",
        name: "Regulation (EU) 2025/327",
        identifier: "CELEX:32025R0327",
      },
      data: data,
      recordCount: Array.isArray(data) ? data.length : 1,
    };

    if (format === "csv" && Array.isArray(data) && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map((row: any) =>
          headers
            .map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return "";
              if (typeof value === "string") {
                return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
              }
              if (Array.isArray(value)) {
                return `"${value.join("; ")}"`;
              }
              return String(value);
            })
            .join(",")
        ),
      ];
      return new Response(csvRows.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="ehds-${resource}.csv"`,
          "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
        },
      });
    }

    return new Response(JSON.stringify(response, null, 2), {
      headers: {
        ...corsHeaders,
        "X-RateLimit-Limit": String(RATE_LIMIT_MAX),
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After",
  "Content-Type": "application/json",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "public, max-age=300",
};

// Allowed resources - expanded whitelist
const ALLOWED_RESOURCES = [
  "articles", "recitals", "definitions", "chapters", "sections",
  "implementing-acts", "annexes", "health-authorities", "country-legislation", "metadata"
];
const ALLOWED_FORMATS = ["json", "csv"];
const ALLOWED_LANGUAGES = ["en", "mt", "de", "fr", "it", "es", "pt", "nl", "pl", "cs", "sk", "hu", "ro", "bg", "el", "sv", "da", "fi", "et", "lv", "lt", "sl", "hr", "ga"];

// Rate limiting config: 100 requests per hour per IP
const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Validate and sanitize ID parameter
function validateId(id: string | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed < 1 || parsed > 10000) return null;
  return parsed;
}

// Validate string ID (for annexes, implementing-acts)
function validateStringId(id: string | null): string | null {
  if (!id) return null;
  // Allow alphanumeric, hyphens, underscores - max 100 chars
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) return null;
  return id;
}

// Validate fields parameter - only allow alphanumeric and underscores
function validateFields(fieldsParam: string | null, allowedFields: string[]): string[] | null {
  if (!fieldsParam) return null;
  const requested = fieldsParam.split(",").map(f => f.trim().toLowerCase());
  const valid = requested.filter(f => allowedFields.includes(f));
  return valid.length > 0 ? valid : null;
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
  
  await supabase
    .from("api_rate_limits")
    .delete()
    .lt("window_start", windowStart.toISOString());
  
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
    await supabase
      .from("api_rate_limits")
      .insert({ ip_address: ip, request_count: 1, window_start: now.toISOString() });
    
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: new Date(now.getTime() + RATE_LIMIT_WINDOW_MS) };
  }
}

// Apply field selection to data
function applyFieldSelection(data: any, fields: string[] | null): any {
  if (!fields || !data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => {
      const filtered: any = {};
      fields.forEach(field => {
        if (field in item) {
          filtered[field] = item[field];
        }
      });
      return filtered;
    });
  }
  
  const filtered: any = {};
  fields.forEach(field => {
    if (field in data) {
      filtered[field] = data[field];
    }
  });
  return filtered;
}

// Convert data to CSV
function toCSV(data: any[]): string {
  if (!data || data.length === 0) return "";
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
          if (typeof value === "object") {
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(",")
    ),
  ];
  return csvRows.join("\n");
}

// Build FAIR metadata wrapper
function buildFairResponse(resource: string, data: any) {
  return {
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
}

// Field definitions per resource for validation
const RESOURCE_FIELDS: Record<string, string[]> = {
  articles: ["article_number", "title", "content", "chapter_id", "section_id", "is_key_provision", "stakeholder_tags"],
  recitals: ["recital_number", "content", "related_articles"],
  definitions: ["term", "definition", "source_article", "source"],
  chapters: ["chapter_number", "title", "description"],
  sections: ["section_number", "title", "chapter_id"],
  "implementing-acts": ["id", "title", "description", "type", "theme", "themes", "status", "article_reference", "related_articles", "feedback_deadline", "official_link"],
  annexes: ["id", "title", "content"],
  "health-authorities": ["id", "name", "country_code", "country_name", "authority_type", "status", "email", "phone", "website", "address", "description", "ehds_role", "latitude", "longitude"],
  "country-legislation": ["id", "country_code", "country_name", "title", "official_title", "legislation_type", "status", "status_notes", "summary", "url", "effective_date", "adoption_date", "publication_date", "enforcement_measures"],
};

Deno.serve(async (req) => {
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

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
    const lang = url.searchParams.get("lang") || "en";
    const fieldsParam = url.searchParams.get("fields");

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

    // Validate language parameter
    if (!ALLOWED_LANGUAGES.includes(lang)) {
      return new Response(
        JSON.stringify({ error: "Invalid language code", allowedLanguages: ALLOWED_LANGUAGES }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate fields if provided
    const allowedFields = resource ? RESOURCE_FIELDS[resource] : [];
    const selectedFields = validateFields(fieldsParam, allowedFields || []);

    console.log(`API request: resource=${resource}, format=${format}, id=${id}, lang=${lang}, fields=${fieldsParam}`);

    let data: any = null;
    let error: any = null;

    switch (resource) {
      case "articles": {
        const validatedId = validateId(id);
        const baseColumns = "article_number, title, content, chapter_id, section_id, is_key_provision, stakeholder_tags";
        
        if (lang !== "en") {
          // Fetch with translations
          if (validatedId) {
            const result = await supabase
              .from("articles")
              .select(`article_number, chapter_id, section_id, is_key_provision, stakeholder_tags,
                article_translations!inner(title, content, language_code, is_published)`)
              .eq("article_number", validatedId)
              .eq("article_translations.language_code", lang)
              .eq("article_translations.is_published", true)
              .single();
            
            if (result.data) {
              const trans = result.data.article_translations?.[0];
              data = {
                article_number: result.data.article_number,
                title: trans?.title,
                content: trans?.content,
                chapter_id: result.data.chapter_id,
                section_id: result.data.section_id,
                language: lang,
              };
            } else {
              // Fallback to English
              const fallback = await supabase
                .from("articles")
                .select(baseColumns)
                .eq("article_number", validatedId)
                .single();
              data = fallback.data ? { ...fallback.data, language: "en", translation_fallback: true } : null;
              error = fallback.error;
            }
          } else {
            const result = await supabase
              .from("articles")
              .select(`article_number, chapter_id, section_id, is_key_provision, stakeholder_tags,
                article_translations(title, content, language_code, is_published)`)
              .order("article_number", { ascending: true });
            
            data = result.data?.map(article => {
              const trans = article.article_translations?.find(
                (t: any) => t.language_code === lang && t.is_published
              );
              return {
                article_number: article.article_number,
                title: trans?.title,
                content: trans?.content,
                chapter_id: article.chapter_id,
                section_id: article.section_id,
                language: trans ? lang : null,
              };
            }).filter(a => a.title && a.content);
            error = result.error;
          }
        } else {
          // English - no translation needed
          if (validatedId) {
            const result = await supabase
              .from("articles")
              .select(baseColumns)
              .eq("article_number", validatedId)
              .single();
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("articles")
              .select(baseColumns)
              .order("article_number", { ascending: true });
            data = result.data;
            error = result.error;
          }
        }
        break;
      }

      case "recitals": {
        const validatedId = validateId(id);
        const baseColumns = "recital_number, content, related_articles";
        
        if (lang !== "en") {
          if (validatedId) {
            const result = await supabase
              .from("recitals")
              .select(`recital_number, related_articles,
                recital_translations!inner(content, language_code, is_published)`)
              .eq("recital_number", validatedId)
              .eq("recital_translations.language_code", lang)
              .eq("recital_translations.is_published", true)
              .single();
            
            if (result.data) {
              const trans = result.data.recital_translations?.[0];
              data = {
                recital_number: result.data.recital_number,
                content: trans?.content,
                related_articles: result.data.related_articles,
                language: lang,
              };
            } else {
              const fallback = await supabase
                .from("recitals")
                .select(baseColumns)
                .eq("recital_number", validatedId)
                .single();
              data = fallback.data ? { ...fallback.data, language: "en", translation_fallback: true } : null;
              error = fallback.error;
            }
          } else {
            const result = await supabase
              .from("recitals")
              .select(`recital_number, related_articles,
                recital_translations(content, language_code, is_published)`)
              .order("recital_number", { ascending: true });
            
            data = result.data?.map(recital => {
              const trans = recital.recital_translations?.find(
                (t: any) => t.language_code === lang && t.is_published
              );
              return {
                recital_number: recital.recital_number,
                content: trans?.content,
                related_articles: recital.related_articles,
                language: trans ? lang : null,
              };
            }).filter(r => r.content);
            error = result.error;
          }
        } else {
          if (validatedId) {
            const result = await supabase
              .from("recitals")
              .select(baseColumns)
              .eq("recital_number", validatedId)
              .single();
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("recitals")
              .select(baseColumns)
              .order("recital_number", { ascending: true });
            data = result.data;
            error = result.error;
          }
        }
        break;
      }

      case "definitions": {
        const baseColumns = "term, definition, source_article, source";
        
        if (lang !== "en") {
          const result = await supabase
            .from("definitions")
            .select(`source_article, source,
              definition_translations(term, definition, language_code, is_published)`)
            .order("term", { ascending: true });
          
          data = result.data?.map(def => {
            const trans = def.definition_translations?.find(
              (t: any) => t.language_code === lang && t.is_published
            );
            return trans ? {
              term: trans.term,
              definition: trans.definition,
              source_article: def.source_article,
              source: def.source,
              language: lang,
            } : null;
          }).filter(Boolean);
          error = result.error;
        } else {
          const result = await supabase
            .from("definitions")
            .select(baseColumns)
            .order("term", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;
      }

      case "chapters": {
        const baseColumns = "chapter_number, title, description";
        
        if (lang !== "en") {
          const result = await supabase
            .from("chapters")
            .select(`chapter_number,
              chapter_translations(title, description, language_code, is_published)`)
            .order("chapter_number", { ascending: true });
          
          data = result.data?.map(ch => {
            const trans = ch.chapter_translations?.find(
              (t: any) => t.language_code === lang && t.is_published
            );
            return trans ? {
              chapter_number: ch.chapter_number,
              title: trans.title,
              description: trans.description,
              language: lang,
            } : null;
          }).filter(Boolean);
          error = result.error;
        } else {
          const result = await supabase
            .from("chapters")
            .select(baseColumns)
            .order("chapter_number", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;
      }

      case "sections": {
        const validatedId = validateId(id);
        const baseColumns = "section_number, title, chapter_id";
        
        if (lang !== "en") {
          const result = await supabase
            .from("sections")
            .select(`section_number, chapter_id,
              section_translations(title, language_code, is_published)`)
            .order("chapter_id", { ascending: true })
            .order("section_number", { ascending: true });
          
          data = result.data?.map(sec => {
            const trans = sec.section_translations?.find(
              (t: any) => t.language_code === lang && t.is_published
            );
            return trans ? {
              section_number: sec.section_number,
              title: trans.title,
              chapter_id: sec.chapter_id,
              language: lang,
            } : null;
          }).filter(Boolean);
          error = result.error;
        } else {
          if (validatedId) {
            const result = await supabase
              .from("sections")
              .select(baseColumns)
              .eq("chapter_id", validatedId)
              .order("section_number", { ascending: true });
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("sections")
              .select(baseColumns)
              .order("chapter_id", { ascending: true })
              .order("section_number", { ascending: true });
            data = result.data;
            error = result.error;
          }
        }
        break;
      }

      case "implementing-acts": {
        const validatedId = validateStringId(id);
        const baseColumns = "id, title, description, type, theme, themes, status, article_reference, related_articles, feedback_deadline, official_link";
        
        if (lang !== "en") {
          const result = await supabase
            .from("implementing_acts")
            .select(`id, type, theme, themes, status, article_reference, related_articles, feedback_deadline, official_link,
              implementing_act_translations(title, description, language_code, is_published)`)
            .order("title", { ascending: true });
          
          data = result.data?.map(act => {
            const trans = act.implementing_act_translations?.find(
              (t: any) => t.language_code === lang && t.is_published
            );
            return {
              id: act.id,
              title: trans?.title,
              description: trans?.description,
              type: act.type,
              theme: act.theme,
              themes: act.themes,
              status: act.status,
              article_reference: act.article_reference,
              related_articles: act.related_articles,
              feedback_deadline: act.feedback_deadline,
              official_link: act.official_link,
              language: trans ? lang : null,
            };
          }).filter(a => a.title);
          error = result.error;
        } else {
          if (validatedId) {
            const result = await supabase
              .from("implementing_acts")
              .select(baseColumns)
              .eq("id", validatedId)
              .single();
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("implementing_acts")
              .select(baseColumns)
              .order("title", { ascending: true });
            data = result.data;
            error = result.error;
          }
        }
        break;
      }

      case "annexes": {
        const validatedId = validateStringId(id);
        const baseColumns = "id, title, content";
        
        if (lang !== "en") {
          const result = await supabase
            .from("annexes")
            .select(`id,
              annex_translations(title, content, language_code, is_published)`)
            .order("id", { ascending: true });
          
          data = result.data?.map(annex => {
            const trans = annex.annex_translations?.find(
              (t: any) => t.language_code === lang && t.is_published
            );
            return trans ? {
              id: annex.id,
              title: trans.title,
              content: trans.content,
              language: lang,
            } : null;
          }).filter(Boolean);
          error = result.error;
        } else {
          if (validatedId) {
            const result = await supabase
              .from("annexes")
              .select(baseColumns)
              .eq("id", validatedId)
              .single();
            data = result.data;
            error = result.error;
          } else {
            const result = await supabase
              .from("annexes")
              .select(baseColumns)
              .order("id", { ascending: true });
            data = result.data;
            error = result.error;
          }
        }
        break;
      }

      case "health-authorities": {
        const validatedId = validateStringId(id);
        const columns = "id, name, country_code, country_name, authority_type, status, email, phone, website, address, description, ehds_role, latitude, longitude";
        
        if (validatedId) {
          const result = await supabase
            .from("health_authorities")
            .select(columns)
            .eq("id", validatedId)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const countryCode = url.searchParams.get("country");
          const authorityType = url.searchParams.get("type");
          
          let query = supabase
            .from("health_authorities")
            .select(columns);
          
          if (countryCode) {
            query = query.eq("country_code", countryCode.toUpperCase());
          }
          if (authorityType) {
            query = query.eq("authority_type", authorityType);
          }
          
          const result = await query.order("country_name", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;
      }

      case "country-legislation": {
        const validatedId = validateStringId(id);
        const columns = "id, country_code, country_name, title, official_title, legislation_type, status, status_notes, summary, url, effective_date, adoption_date, publication_date, enforcement_measures";
        
        if (validatedId) {
          const result = await supabase
            .from("country_legislation")
            .select(columns)
            .eq("id", validatedId)
            .single();
          data = result.data;
          error = result.error;
        } else {
          const countryCode = url.searchParams.get("country");
          const status = url.searchParams.get("status");
          
          let query = supabase
            .from("country_legislation")
            .select(columns);
          
          if (countryCode) {
            query = query.eq("country_code", countryCode.toUpperCase());
          }
          if (status) {
            query = query.eq("status", status);
          }
          
          const result = await query.order("country_name", { ascending: true });
          data = result.data;
          error = result.error;
        }
        break;
      }

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
            version: "2.0",
            endpoints: ALLOWED_RESOURCES.filter(r => r !== "metadata").map(resource => ({
              resource,
              description: getResourceDescription(resource),
            })),
            formats: ALLOWED_FORMATS,
            languages: ALLOWED_LANGUAGES,
            features: ["field_selection", "translations", "filtering"],
          },
          license: "MIT",
          source: "https://github.com/stefanbuttigieg/ehdsexplorer",
          openapi: "https://api.ehdsexplorer.eu/openapi.json",
        };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Resource required",
            availableResources: ALLOWED_RESOURCES,
            usage: "?resource=articles&format=json&id=1&lang=en&fields=title,content",
          }),
          { status: 400, headers: corsHeaders }
        );
    }

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: "Unable to retrieve data" }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Apply field selection if requested
    if (selectedFields) {
      data = applyFieldSelection(data, selectedFields);
    }

    // Build response
    const response = buildFairResponse(resource!, data);

    if (format === "csv" && Array.isArray(data) && data.length > 0) {
      return new Response(toCSV(data), {
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

function getResourceDescription(resource: string): string {
  const descriptions: Record<string, string> = {
    articles: "All 105 articles of the EHDS Regulation",
    recitals: "All 115 recitals providing interpretation guidance",
    definitions: "Defined terms from Article 2 and related sources",
    chapters: "Chapter structure of the regulation",
    sections: "Section subdivisions within chapters",
    "implementing-acts": "Implementing and delegated acts tracker",
    annexes: "Regulation annexes",
    "health-authorities": "National Digital Health Authorities and Health Data Access Bodies",
    "country-legislation": "National implementing legislation tracker",
  };
  return descriptions[resource] || resource;
}

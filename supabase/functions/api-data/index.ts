import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const resource = url.searchParams.get("resource");
    const format = url.searchParams.get("format") || "json";
    const id = url.searchParams.get("id");

    console.log(`API request: resource=${resource}, format=${format}, id=${id}`);

    let data: any = null;
    let error: any = null;

    switch (resource) {
      case "articles":
        if (id) {
          const result = await supabase
            .from("articles")
            .select("article_number, title, content, chapter_id, section_id")
            .eq("article_number", parseInt(id))
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
        if (id) {
          const result = await supabase
            .from("recitals")
            .select("recital_number, content, related_articles")
            .eq("recital_number", parseInt(id))
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
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
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
        },
      });
    }

    return new Response(JSON.stringify(response, null, 2), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});

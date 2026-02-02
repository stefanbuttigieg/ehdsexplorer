import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// eHDSI KPI definitions with page URLs
const KPI_PAGES = [
  {
    id: "KPI-1.1",
    name: "Countries with Operational NCPeH",
    category: "infrastructure",
    unit: "countries",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_0/",
  },
  {
    id: "KPI-1.3",
    name: "ePrescriptions Exchanged",
    category: "transactions",
    unit: "transactions",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_9/",
  },
  {
    id: "KPI-1.5",
    name: "Patient Summaries Exchanged",
    category: "transactions",
    unit: "transactions",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_11/",
  },
  {
    id: "KPI-1.9.1",
    name: "Pharmacies Operational with MyHealth@EU",
    category: "infrastructure",
    unit: "pharmacies",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_2/",
  },
  {
    id: "KPI-1.9.2",
    name: "Hospitals Operational with MyHealth@EU",
    category: "infrastructure",
    unit: "hospitals",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_7/",
  },
  {
    id: "KPI-1.11",
    name: "Citizens Using ePrescription Service",
    category: "citizen_adoption",
    unit: "citizens",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_15/",
  },
  {
    id: "KPI-1.12",
    name: "Citizens Using Patient Summary Service",
    category: "citizen_adoption",
    unit: "citizens",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_18/",
  },
  {
    id: "KPI-3.3",
    name: "NCPeH Uptime",
    category: "reliability",
    unit: "percentage",
    url: "https://experience.arcgis.com/experience/77f459be23e545b48f46a79cfaf19423/page/page_3/",
  },
];

// EU country codes and names
const EU_COUNTRIES: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  EL: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.entries(
  EU_COUNTRIES
).reduce(
  (acc, [code, name]) => {
    acc[name.toLowerCase()] = code;
    return acc;
  },
  {} as Record<string, string>
);

// Add common variations
COUNTRY_NAME_TO_CODE["czechia"] = "CZ";
COUNTRY_NAME_TO_CODE["czech republic"] = "CZ";
COUNTRY_NAME_TO_CODE["greece"] = "GR";
COUNTRY_NAME_TO_CODE["the netherlands"] = "NL";

function normalizeCountryCode(input: string): string | null {
  if (!input) return null;
  const normalized = input.trim().toUpperCase();

  // Direct code match
  if (EU_COUNTRIES[normalized]) return normalized;
  if (normalized === "EL") return "GR"; // Greece

  // Name match
  const fromName = COUNTRY_NAME_TO_CODE[input.trim().toLowerCase()];
  if (fromName) return fromName;

  return null;
}

// Parse country data from scraped markdown content
function parseCountryData(
  markdown: string,
  kpiDef: (typeof KPI_PAGES)[0]
): Array<{
  country_code: string;
  country_name: string;
  value: number;
}> {
  const results: Array<{
    country_code: string;
    country_name: string;
    value: number;
  }> = [];

  // Common patterns in the scraped content
  // Look for country names followed by numbers
  const lines = markdown.split("\n");

  for (const line of lines) {
    // Try to find country name and value patterns
    for (const [code, name] of Object.entries(EU_COUNTRIES)) {
      if (line.toLowerCase().includes(name.toLowerCase())) {
        // Extract numbers from the same line
        const numbers = line.match(/[\d,]+(?:\.\d+)?/g);
        if (numbers && numbers.length > 0) {
          const value = parseFloat(numbers[0].replace(/,/g, ""));
          if (!isNaN(value)) {
            results.push({
              country_code: code,
              country_name: name,
              value,
            });
            break;
          }
        }
      }
    }
  }

  // Also try table pattern: | Country | Value |
  const tablePattern =
    /\|\s*([A-Za-z\s]+)\s*\|\s*([\d,]+(?:\.\d+)?)\s*\|/g;
  let match;
  while ((match = tablePattern.exec(markdown)) !== null) {
    const countryCode = normalizeCountryCode(match[1]);
    if (countryCode) {
      const value = parseFloat(match[2].replace(/,/g, ""));
      if (!isNaN(value)) {
        results.push({
          country_code: countryCode,
          country_name: EU_COUNTRIES[countryCode],
          value,
        });
      }
    }
  }

  return results;
}

async function scrapeKpiPage(
  kpiDef: (typeof KPI_PAGES)[0],
  firecrawlKey: string
): Promise<any[]> {
  try {
    console.log(`Scraping ${kpiDef.id}: ${kpiDef.url}`);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: kpiDef.url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 5000, // Wait for dynamic content
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error for ${kpiDef.id}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const markdown = data.data?.markdown || data.markdown || "";

    if (!markdown) {
      console.log(`No content scraped for ${kpiDef.id}`);
      return [];
    }

    console.log(
      `Scraped ${markdown.length} chars for ${kpiDef.id}`
    );

    // Parse country data from the markdown
    const countryData = parseCountryData(markdown, kpiDef);

    console.log(`Found ${countryData.length} country records for ${kpiDef.id}`);

    return countryData.map((d) => ({
      country_code: d.country_code,
      country_name: d.country_name,
      kpi_id: kpiDef.id,
      kpi_name: kpiDef.name,
      kpi_category: kpiDef.category,
      value: d.value,
      unit: kpiDef.unit,
      reference_date: new Date().toISOString().split("T")[0],
      raw_data: { scraped_content_preview: markdown.substring(0, 500) },
      source_url: kpiDef.url,
    }));
  } catch (error) {
    console.error(`Error scraping ${kpiDef.id}:`, error);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { manual = false } = await req.json().catch(() => ({}));

    console.log(
      `Starting eHDSI KPI sync (${manual ? "manual" : "scheduled"})...`
    );

    if (!firecrawlKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firecrawl API key not configured. Please connect Firecrawl in Settings.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create sync history record
    const { data: syncRecord, error: syncError } = await supabase
      .from("ehdsi_sync_history")
      .insert({
        triggered_by: manual ? "manual" : "scheduled",
        status: "running",
      })
      .select()
      .single();

    if (syncError) {
      console.error("Failed to create sync record:", syncError);
    }

    const syncId = syncRecord?.id;
    const allStagingRecords: any[] = [];

    // Scrape each KPI page
    for (const kpiDef of KPI_PAGES) {
      const records = await scrapeKpiPage(kpiDef, firecrawlKey);
      allStagingRecords.push(...records);

      // Rate limit - wait between requests
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const totalFetched = allStagingRecords.length;
    console.log(`Total records extracted: ${totalFetched}`);

    // Deduplicate by country + KPI
    const uniqueRecords = new Map<string, any>();
    for (const record of allStagingRecords) {
      const key = `${record.country_code}-${record.kpi_id}`;
      if (
        !uniqueRecords.has(key) ||
        record.value > uniqueRecords.get(key).value
      ) {
        uniqueRecords.set(key, record);
      }
    }

    const deduplicatedRecords = Array.from(uniqueRecords.values());
    console.log(`Deduplicated to: ${deduplicatedRecords.length} records`);

    // Check for existing records in staging
    const { data: existingStaging } = await supabase
      .from("ehdsi_kpi_staging")
      .select("country_code, kpi_id, value")
      .eq("status", "pending");

    const existingKeys = new Set(
      (existingStaging || []).map((r) => `${r.country_code}-${r.kpi_id}`)
    );

    // Filter to only new records
    const newRecords = deduplicatedRecords.filter((r) => {
      const key = `${r.country_code}-${r.kpi_id}`;
      return !existingKeys.has(key);
    });

    const totalNew = newRecords.length;
    console.log(`New records to insert: ${totalNew}`);

    // Insert new records into staging
    if (newRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("ehdsi_kpi_staging")
        .insert(newRecords);

      if (insertError) {
        console.error("Failed to insert staging records:", insertError);
        throw insertError;
      }
    }

    // Update sync history
    if (syncId) {
      await supabase
        .from("ehdsi_sync_history")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          records_fetched: totalFetched,
          records_new: totalNew,
        })
        .eq("id", syncId);
    }

    console.log(
      `Sync completed: ${totalFetched} fetched, ${totalNew} new staging records`
    );

    return new Response(
      JSON.stringify({
        success: true,
        fetched: totalFetched,
        new: totalNew,
        message: `Found ${totalNew} new KPI records pending review`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

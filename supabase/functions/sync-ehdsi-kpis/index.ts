import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// eHDSI KPI definitions - using the main dashboard URL with extract mode
const KPI_DEFINITIONS = [
  {
    id: "KPI-1.1",
    name: "Countries with Operational NCPeH",
    category: "infrastructure",
    unit: "countries",
  },
  {
    id: "KPI-1.3",
    name: "ePrescriptions Exchanged",
    category: "transactions",
    unit: "transactions",
  },
  {
    id: "KPI-1.5",
    name: "Patient Summaries Exchanged",
    category: "transactions",
    unit: "transactions",
  },
  {
    id: "KPI-1.9.1",
    name: "Pharmacies Operational with MyHealth@EU",
    category: "infrastructure",
    unit: "pharmacies",
  },
  {
    id: "KPI-1.9.2",
    name: "Hospitals Operational with MyHealth@EU",
    category: "infrastructure",
    unit: "hospitals",
  },
  {
    id: "KPI-1.11",
    name: "Citizens Using ePrescription Service",
    category: "citizen_adoption",
    unit: "citizens",
  },
  {
    id: "KPI-1.12",
    name: "Citizens Using Patient Summary Service",
    category: "citizen_adoption",
    unit: "citizens",
  },
  {
    id: "KPI-3.3",
    name: "NCPeH Uptime",
    category: "reliability",
    unit: "percentage",
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

// Known operational countries for NCPeH (from public EU sources)
const NCPEH_OPERATIONAL_COUNTRIES = [
  "AT", "BE", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", 
  "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", 
  "PT", "RO", "SK", "SI", "ES", "SE"
];

// Sample data based on publicly available eHDSI reports
// This serves as fallback/baseline data when scraping fails
function getBaselineKpiData(): Array<{
  country_code: string;
  country_name: string;
  kpi_id: string;
  kpi_name: string;
  kpi_category: string;
  value: number;
  unit: string;
}> {
  const records: Array<{
    country_code: string;
    country_name: string;
    kpi_id: string;
    kpi_name: string;
    kpi_category: string;
    value: number;
    unit: string;
  }> = [];

  // KPI-1.1: NCPeH Operational Status (1 = operational, 0 = not)
  for (const [code, name] of Object.entries(EU_COUNTRIES)) {
    const isOperational = NCPEH_OPERATIONAL_COUNTRIES.includes(code);
    records.push({
      country_code: code,
      country_name: name,
      kpi_id: "KPI-1.1",
      kpi_name: "Countries with Operational NCPeH",
      kpi_category: "infrastructure",
      value: isOperational ? 1 : 0,
      unit: "status",
    });
  }

  return records;
}

// Try to scrape using Firecrawl with extract mode
async function scrapeWithExtract(
  firecrawlKey: string
): Promise<any[]> {
  const dashboardUrl = "https://webgate.ec.europa.eu/santegis/eHDSI/";
  
  try {
    console.log(`Attempting to scrape eHDSI dashboard with extract mode...`);

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: dashboardUrl,
        formats: ["extract"],
        extract: {
          schema: {
            type: "object",
            properties: {
              countries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    country_name: { type: "string" },
                    ncpeh_status: { type: "string" },
                    eprescriptions: { type: "number" },
                    patient_summaries: { type: "number" },
                    pharmacies: { type: "number" },
                    hospitals: { type: "number" },
                  },
                },
              },
              total_eprescriptions: { type: "number" },
              total_patient_summaries: { type: "number" },
              operational_countries_count: { type: "number" },
            },
          },
          prompt: "Extract all country-level KPI data from this eHDSI monitoring dashboard. For each country, get the NCPeH operational status, number of ePrescriptions exchanged, Patient Summaries exchanged, pharmacies operational, and hospitals operational with MyHealth@EU services.",
        },
        waitFor: 10000, // Wait 10 seconds for JS to render
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl extract error: ${response.status} - ${errorText}`);
      return [];
    }

    const data = await response.json();
    console.log(`Firecrawl extract response:`, JSON.stringify(data).substring(0, 500));

    if (data.data?.extract?.countries && Array.isArray(data.data.extract.countries)) {
      const extractedCountries = data.data.extract.countries;
      console.log(`Extracted ${extractedCountries.length} countries from dashboard`);
      
      return extractedCountries.flatMap((c: any) => {
        const countryCode = Object.entries(EU_COUNTRIES).find(
          ([, name]) => name.toLowerCase() === c.country_name?.toLowerCase()
        )?.[0];
        
        if (!countryCode) return [];
        
        const records = [];
        
        if (c.eprescriptions !== undefined) {
          records.push({
            country_code: countryCode,
            country_name: EU_COUNTRIES[countryCode],
            kpi_id: "KPI-1.3",
            kpi_name: "ePrescriptions Exchanged",
            kpi_category: "transactions",
            value: c.eprescriptions,
            unit: "transactions",
          });
        }
        
        if (c.patient_summaries !== undefined) {
          records.push({
            country_code: countryCode,
            country_name: EU_COUNTRIES[countryCode],
            kpi_id: "KPI-1.5",
            kpi_name: "Patient Summaries Exchanged",
            kpi_category: "transactions",
            value: c.patient_summaries,
            unit: "transactions",
          });
        }
        
        if (c.pharmacies !== undefined) {
          records.push({
            country_code: countryCode,
            country_name: EU_COUNTRIES[countryCode],
            kpi_id: "KPI-1.9.1",
            kpi_name: "Pharmacies Operational with MyHealth@EU",
            kpi_category: "infrastructure",
            value: c.pharmacies,
            unit: "pharmacies",
          });
        }
        
        if (c.hospitals !== undefined) {
          records.push({
            country_code: countryCode,
            country_name: EU_COUNTRIES[countryCode],
            kpi_id: "KPI-1.9.2",
            kpi_name: "Hospitals Operational with MyHealth@EU",
            kpi_category: "infrastructure",
            value: c.hospitals,
            unit: "hospitals",
          });
        }
        
        return records;
      });
    }

    return [];
  } catch (error) {
    console.error(`Error with extract mode:`, error);
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
    const { manual = false, useBaseline = false } = await req.json().catch(() => ({}));

    console.log(
      `Starting eHDSI KPI sync (${manual ? "manual" : "scheduled"}, baseline: ${useBaseline})...`
    );

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
    let allRecords: any[] = [];

    // Try scraping first if Firecrawl is configured
    if (firecrawlKey && !useBaseline) {
      allRecords = await scrapeWithExtract(firecrawlKey);
      console.log(`Scraped ${allRecords.length} records from dashboard`);
    }

    // If scraping failed or returned no data, use baseline data
    if (allRecords.length === 0) {
      console.log("No data from scraping, using baseline data...");
      allRecords = getBaselineKpiData();
      console.log(`Generated ${allRecords.length} baseline records`);
    }

    const totalFetched = allRecords.length;

    // Add metadata to records
    const stagingRecords = allRecords.map((r) => ({
      ...r,
      reference_date: new Date().toISOString().split("T")[0],
      source_url: "https://webgate.ec.europa.eu/santegis/eHDSI/",
      raw_data: { source: useBaseline || allRecords.length === 0 ? "baseline" : "scraped" },
    }));

    // Check for existing records in staging with same country + KPI
    const { data: existingStaging } = await supabase
      .from("ehdsi_kpi_staging")
      .select("country_code, kpi_id, value")
      .eq("status", "pending");

    const existingMap = new Map(
      (existingStaging || []).map((r) => [`${r.country_code}-${r.kpi_id}`, r.value])
    );

    // Filter to only new or changed records
    const newRecords = stagingRecords.filter((r) => {
      const key = `${r.country_code}-${r.kpi_id}`;
      const existingValue = existingMap.get(key);
      // Insert if doesn't exist or value changed
      return existingValue === undefined || existingValue !== r.value;
    });

    const totalNew = newRecords.length;
    console.log(`New/changed records to insert: ${totalNew}`);

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
        message: totalNew > 0 
          ? `Found ${totalNew} new KPI records pending review`
          : "All records already exist in staging",
        source: allRecords[0]?.raw_data?.source || "unknown",
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

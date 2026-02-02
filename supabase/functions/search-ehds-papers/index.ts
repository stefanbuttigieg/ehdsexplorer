import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FirecrawlSearchResult {
  url: string;
  title: string;
  description?: string;
  markdown?: string;
}

interface FirecrawlSearchResponse {
  success: boolean;
  data?: FirecrawlSearchResult[];
  error?: string;
}

// Search queries for EHDS-related academic papers and EU sources
const SEARCH_QUERIES = [
  // Academic searches - broader queries
  '"European Health Data Space" research paper',
  '"EHDS Regulation" health data study',
  'site:pubmed.ncbi.nlm.nih.gov "European Health Data Space"',
  // EU official sources
  'site:health.ec.europa.eu EHDS publications',
  'site:hadea.ec.europa.eu EHDS project deliverables',
  'site:tehdas.eu deliverables results',
  'site:xpandh-project.eu deliverables',
];

// Extract organization from URL
function extractOrganization(url: string): string {
  if (url.includes('pubmed.ncbi.nlm.nih.gov')) return 'PubMed / NCBI';
  if (url.includes('arxiv.org')) return 'arXiv';
  if (url.includes('researchgate.net')) return 'ResearchGate';
  if (url.includes('health.ec.europa.eu')) return 'European Commission DG SANTE';
  if (url.includes('hadea.ec.europa.eu')) return 'HaDEA (EU Health and Digital Executive Agency)';
  if (url.includes('digital-strategy.ec.europa.eu')) return 'European Commission Digital Strategy';
  if (url.includes('europa.eu')) return 'European Union';
  
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch {
    return 'Unknown';
  }
}

// Domains to exclude (social media, generic sites, etc.)
const EXCLUDED_DOMAINS = [
  'instagram.com',
  'facebook.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'youtube.com',
  'tiktok.com',
  'reddit.com',
  'wikipedia.org',
  'en.wikipedia.org',
  'amazon.com',
  'google.com',
];

// Check if URL should be excluded
function shouldExclude(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return EXCLUDED_DOMAINS.some(domain => hostname.includes(domain));
  } catch {
    return false;
  }
}

// Normalize URL for deduplication
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove trailing slashes, query params, and fragments for comparison
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/$/, '')}`.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting EHDS paper search job...');

    // Get existing works to avoid duplicates
    const { data: existingWorks, error: fetchError } = await supabase
      .from('published_works')
      .select('link, name');

    if (fetchError) {
      console.error('Error fetching existing works:', fetchError);
      throw fetchError;
    }

    const existingUrls = new Set(existingWorks?.map(w => normalizeUrl(w.link)) || []);
    const existingNames = new Set(existingWorks?.map(w => w.name.toLowerCase()) || []);

    console.log(`Found ${existingUrls.size} existing published works`);

    const allResults: FirecrawlSearchResult[] = [];
    const seenUrls = new Set<string>();

    // Run searches
    for (const query of SEARCH_QUERIES) {
      console.log(`Searching: ${query.substring(0, 50)}...`);
      
      try {
        const response = await fetch('https://api.firecrawl.dev/v1/search', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            limit: 10,
            // Only apply time filter for scheduled runs, not manual triggers
            // tbs: 'qdr:m', // Last month - removed for broader results
          }),
        });

        if (!response.ok) {
          console.error(`Search failed for query: ${query}`, await response.text());
          continue;
        }

        const data: FirecrawlSearchResponse = await response.json();
        
        if (data.success && data.data) {
          for (const result of data.data) {
            const normalizedUrl = normalizeUrl(result.url);
            
            // Skip excluded domains (social media, etc.)
            if (shouldExclude(result.url)) {
              console.log(`Skipping excluded domain: ${result.url}`);
              continue;
            }
            
            // Skip if we've seen this URL in this batch or it exists in DB
            if (seenUrls.has(normalizedUrl) || existingUrls.has(normalizedUrl)) {
              continue;
            }
            
            // Skip if the title already exists (fuzzy match)
            if (result.title && existingNames.has(result.title.toLowerCase())) {
              continue;
            }
            
            seenUrls.add(normalizedUrl);
            allResults.push(result);
          }
        }
      } catch (searchError) {
        console.error(`Error searching for "${query}":`, searchError);
      }
      
      // Small delay between searches to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`Found ${allResults.length} new papers to add`);

    // Insert new papers
    const insertedWorks: string[] = [];
    
    for (const result of allResults) {
      if (!result.title || !result.url) continue;
      
      const workData = {
        name: result.title.substring(0, 500), // Limit title length
        link: result.url,
        affiliated_organization: extractOrganization(result.url),
        related_articles: [] as number[],
        related_implementing_acts: [] as string[],
        is_auto_discovered: true,
        source_url: result.url,
      };

      const { error: insertError } = await supabase
        .from('published_works')
        .insert([workData]);

      if (insertError) {
        console.error(`Failed to insert "${result.title}":`, insertError.message);
      } else {
        insertedWorks.push(result.title);
        console.log(`Added: ${result.title}`);
      }
    }

    const summary = {
      success: true,
      searched: SEARCH_QUERIES.length,
      found: allResults.length,
      added: insertedWorks.length,
      papers: insertedWorks,
      timestamp: new Date().toISOString(),
    };

    console.log('Search job completed:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in EHDS paper search job:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

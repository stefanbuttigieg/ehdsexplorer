// Runs before `vite dev` and `vite build` (predev/prebuild hooks).
// Generates public/sitemap.xml from static routes plus dynamic content
// (articles, recitals, news, FAQs, implementing acts, annexes) pulled
// from the Supabase database via the public REST API.

import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ehdsexplorer.eu";
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://giwrfhupfphvxlfwpsdh.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpd3JmaHVwZnBodnhsZndwc2RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0OTk5MDcsImV4cCI6MjA4NjA3NTkwN30.HbsFF3s7kh5aldxknf8xNT-E45AN_gp47tapngh9_Fs";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/overview", changefreq: "monthly", priority: "0.9" },
  { path: "/articles", changefreq: "weekly", priority: "0.9" },
  { path: "/recitals", changefreq: "weekly", priority: "0.8" },
  { path: "/definitions", changefreq: "monthly", priority: "0.8" },
  { path: "/annexes", changefreq: "monthly", priority: "0.7" },
  { path: "/implementing-acts", changefreq: "weekly", priority: "0.8" },
  { path: "/search", changefreq: "monthly", priority: "0.6" },
  { path: "/faqs", changefreq: "weekly", priority: "0.8" },
  { path: "/news", changefreq: "weekly", priority: "0.8" },
  { path: "/help", changefreq: "monthly", priority: "0.6" },
  { path: "/topic-index", changefreq: "monthly", priority: "0.7" },
  { path: "/cross-regulation-map", changefreq: "monthly", priority: "0.7" },
  { path: "/health-authorities", changefreq: "monthly", priority: "0.6" },
  { path: "/for/citizens", changefreq: "monthly", priority: "0.8" },
  { path: "/for/healthtech", changefreq: "monthly", priority: "0.8" },
  { path: "/for/healthcare-professionals", changefreq: "monthly", priority: "0.8" },
  { path: "/scenario-finder", changefreq: "monthly", priority: "0.6" },
  { path: "/tools", changefreq: "monthly", priority: "0.6" },
  { path: "/api", changefreq: "monthly", priority: "0.5" },
  { path: "/games", changefreq: "monthly", priority: "0.5" },
];

async function fetchTable(
  table: string,
  select: string,
  query = "",
): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${query ? `&${query}` : ""}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "count=exact",
    },
  });
  if (!res.ok) {
    console.warn(`[sitemap] failed to fetch ${table}: ${res.status}`);
    return [];
  }
  return res.json();
}

function toIsoDate(value: unknown): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().split("T")[0];
}

async function buildDynamicEntries(): Promise<SitemapEntry[]> {
  const [articles, recitals, news, faqs, acts, annexes] = await Promise.all([
    fetchTable("articles", "article_number,updated_at"),
    fetchTable("recitals", "recital_number,updated_at"),
    fetchTable("news_summaries", "id,updated_at", "is_published=eq.true"),
    fetchTable("ehds_faqs", "faq_number,updated_at", "is_published=eq.true"),
    fetchTable("implementing_acts", "id,updated_at"),
    fetchTable("annexes", "id,updated_at"),
  ]);

  const entries: SitemapEntry[] = [];

  for (const a of articles) {
    if (a.article_number == null) continue;
    entries.push({
      path: `/article/${a.article_number}`,
      lastmod: toIsoDate(a.updated_at),
      changefreq: "monthly",
      priority: "0.7",
    });
  }
  for (const r of recitals) {
    if (r.recital_number == null) continue;
    entries.push({
      path: `/recital/${r.recital_number}`,
      lastmod: toIsoDate(r.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }
  for (const n of news) {
    if (!n.id) continue;
    entries.push({
      path: `/news/${n.id}`,
      lastmod: toIsoDate(n.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }
  for (const f of faqs) {
    if (f.faq_number == null) continue;
    entries.push({
      path: `/faq/${f.faq_number}`,
      lastmod: toIsoDate(f.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }
  for (const ia of acts) {
    if (!ia.id) continue;
    entries.push({
      path: `/implementing-acts/${ia.id}`,
      lastmod: toIsoDate(ia.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    });
  }
  for (const an of annexes) {
    if (!an.id) continue;
    entries.push({
      path: `/annex/${an.id}`,
      lastmod: toIsoDate(an.updated_at),
      changefreq: "monthly",
      priority: "0.5",
    });
  }

  return entries;
}

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

async function main() {
  let dynamic: SitemapEntry[] = [];
  try {
    dynamic = await buildDynamicEntries();
  } catch (err) {
    console.warn("[sitemap] dynamic fetch failed, writing static-only:", err);
  }

  const seen = new Set<string>();
  const all = [...staticEntries, ...dynamic].filter((e) => {
    if (seen.has(e.path)) return false;
    seen.add(e.path);
    return true;
  });

  writeFileSync(resolve("public/sitemap.xml"), renderSitemap(all));
  console.log(
    `[sitemap] wrote ${all.length} entries (${staticEntries.length} static + ${dynamic.length} dynamic)`,
  );
}

main().catch((err) => {
  console.error("[sitemap] generation failed:", err);
  process.exit(0); // don't block dev/build
});
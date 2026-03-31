

# EHDS FAQs: Dedicated Table, PDF Parser, and Auto-Update System

## Overview

Create a new `ehds_faqs` table purpose-built for the 67 official EU Commission EHDS FAQs, with a dedicated PDF parsing pipeline and an auto-update mechanism that monitors the EU source page for new versions.

## Architecture

```text
EU Source Page ──> Firecrawl scrape ──> Detect PDF URL change
                                            │
                                      Download PDF
                                            │
                                    Edge Function Parser
                                      (parse-ehds-faq)
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                         ehds_faqs    ehds_faq_footnotes  parse log
                              │
                    ┌─────────┼──────────┐
                    ▼         ▼          ▼
               /faqs page  AI Assistant  Article sidebar
```

## Step 1 — Database Schema

**New table: `ehds_faqs`**
- `id` uuid PK
- `faq_number` integer NOT NULL UNIQUE — official number (1-67)
- `question` text NOT NULL
- `answer` text NOT NULL — plain text summary
- `rich_content` text — full markdown with tables, links, lists
- `chapter` text NOT NULL — e.g. "General", "Primary Use of Health Data"
- `sub_category` text — e.g. "For patients", "For manufacturers"
- `source_articles` text[] — referenced article numbers for cross-linking
- `source_references` text — "Sources: Article X, Recital Y" line
- `is_published` boolean DEFAULT true
- `sort_order` integer DEFAULT 0
- `pdf_version` text — tracks which PDF version this came from
- `created_at`, `updated_at` timestamps

**New table: `ehds_faq_footnotes`**
- `id` uuid PK
- `faq_id` uuid REFERENCES ehds_faqs ON DELETE CASCADE
- `marker` text NOT NULL
- `content` text NOT NULL
- `created_at` timestamp

**New table: `ehds_faq_sync_log`**
- `id` uuid PK
- `pdf_url` text
- `pdf_hash` text — SHA-256 of downloaded PDF for change detection
- `faqs_parsed` integer
- `footnotes_parsed` integer
- `status` text — 'success', 'error', 'no_change'
- `error_message` text
- `created_at` timestamp

RLS: public read on `ehds_faqs` and `ehds_faq_footnotes`; admin write on all three.

## Step 2 — PDF Parser Edge Function (`parse-ehds-faq`)

A new edge function that:
1. Accepts a PDF URL or uses the default EU source
2. Downloads the PDF binary
3. Sends it to the Lovable AI gateway with a structured extraction prompt to parse all FAQ content across all pages (handling the 61-page, 67-question document)
4. For each FAQ extracts: number, question, full answer (markdown), chapter, sub-category, source article references, footnotes
5. Uses batch processing — splits the PDF into page ranges and processes in chunks to handle the full 61 pages
6. Computes a SHA-256 hash of the PDF to detect changes
7. Upserts all FAQs into `ehds_faqs` (keyed on `faq_number`)
8. Upserts footnotes into `ehds_faq_footnotes`
9. Logs the result to `ehds_faq_sync_log`

The AI extraction prompt will be specifically tuned to:
- Identify H2-style chapter headings as `chapter` values
- Detect sub-sections (e.g. "For patients") as `sub_category`
- Preserve tables as markdown tables in `rich_content`
- Extract "Sources:" lines and parse article numbers into `source_articles` array
- Extract footnote markers and their corresponding text

## Step 3 — Auto-Update Mechanism

**New edge function: `check-ehds-faq-updates`**
1. Uses Firecrawl to scrape `https://health.ec.europa.eu/ehealth-digital-health-and-care/ehds-action_en`
2. Extracts the PDF download link for the FAQ document
3. Downloads the PDF and computes SHA-256 hash
4. Compares against the last hash in `ehds_faq_sync_log`
5. If changed → invokes `parse-ehds-faq` with the new URL
6. If unchanged → logs `no_change` and exits

**Scheduled via pg_cron**: runs weekly (e.g. every Monday at 06:00 UTC).

## Step 4 — Admin PDF Parsing UI

**New admin page: `AdminEhdsFaqParserPage`** (route: `/admin/ehds-faq-parser`)

Features:
- "Sync Now" button — manually triggers the parse-ehds-faq function
- PDF URL input — override the default EU source URL
- Upload a PDF directly from local machine as alternative
- Sync log table showing history (date, status, FAQs parsed, hash)
- Preview of parsed FAQs before committing (optional dry-run mode)
- Progress indicator during parsing

## Step 5 — Public FAQ Page (`/faqs`)

- Chapter navigation sidebar (sticky) with counts
- Search bar with fuzzy matching across questions and answers
- Accordion display grouped by chapter, then sub-category
- Rich content rendering (markdown tables, links)
- Footnote tooltips and section per FAQ
- Article reference badges linking to `/articles/{number}`
- FAQ cross-references (e.g. "see question 33") become clickable anchors
- FAQ structured data (JSON-LD) for SEO

## Step 6 — Article Sidebar Integration

Update `ArticlePage.tsx` to query `ehds_faqs` where `source_articles` contains current article number and display "Related Official FAQs" card with links to `/faqs#faq-{number}`.

## Step 7 — AI Assistant Integration

Update `ehds-assistant` edge function to:
- Fetch from `ehds_faqs` (with `rich_content` and footnotes) instead of `help_center_faq`
- Instruct the model to prioritize official FAQ answers and cite by number

## Files

| Action | File |
|--------|------|
| Create | Migration: `ehds_faqs`, `ehds_faq_footnotes`, `ehds_faq_sync_log` tables |
| Create | `supabase/functions/parse-ehds-faq/index.ts` |
| Create | `supabase/functions/check-ehds-faq-updates/index.ts` |
| Create | `src/pages/AdminEhdsFaqParserPage.tsx` |
| Create | `src/pages/FAQsPage.tsx` |
| Create | `src/hooks/useEhdsFaqs.ts` |
| Modify | `src/App.tsx` — add routes |
| Modify | `src/pages/ArticlePage.tsx` — sidebar FAQ card |
| Modify | `supabase/functions/ehds-assistant/index.ts` — use `ehds_faqs` |
| Modify | `src/components/Layout.tsx` — nav link |

## Technical Notes

- The PDF parser uses the Lovable AI gateway (`LOVABLE_API_KEY`) for structured extraction — no additional API keys needed
- PDF download in the edge function uses `fetch()` to get the binary, then base64-encodes for the AI prompt
- For the 61-page PDF, processing is split into ~10-page chunks with sequential AI calls to stay within token limits
- The `help_center_faq` table remains for platform-specific FAQs (navigation, features, accessibility); `ehds_faqs` is exclusively for the official EU Commission Q&As
- The pg_cron schedule uses `net.http_post` to invoke the check function weekly


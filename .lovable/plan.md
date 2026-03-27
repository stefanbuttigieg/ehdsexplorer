
You’re hitting **two separate issues at once**:

1) **Wrong content is being fetched in Batch All**  
- The batch fetch URL currently uses:  
  `https://eur-lex.europa.eu/legal-content/{LANG}/TXT/HTML/?uri=CELEX:...`  
- In your logs, this returns an **Official Journal shell page** (cookie/header/chrome + language table), not the regulation body.  
- That’s why structure analysis shows:
  - `hasMarkdownTables: true`
  - `articleCount: 0`
  - `recitalCount: 0`
  - `firstArticleIndex: -1`

2) **Language in the error is misleading (`en`)**  
- In `parseDocumentAdaptive`, when language detection is `unknown`, it hard-falls back to `'en'`.
- Batch error text uses that fallback value, so failures for `fr`, `es`, `it`, etc. all report detected lang `en`.

Implementation plan (after your approval):

1. **Fix misleading language reporting first (quick win)**
- In `BatchEurLexImporter`, keep `effectiveLang = requested langCode` and use that in all low-parse errors.
- Error format becomes e.g.  
  `Low parse count for FR: 0 articles, 0 recitals (parser detected: unknown)`  
  instead of falsely showing `en`.

2. **Stop forcing `unknown -> en` as a displayed detected language**
- In `useAdaptiveParser`, keep `detectedLanguage` as `unknown` in output when detection fails.
- Use a separate internal parsing fallback language only for regex selection (not for reporting).

3. **Add a fetch quality gate before parsing**
- In `BatchEurLexImporter`, detect “page shell / wrong document” responses by checking markers like:
  - “Official Journal of the European Union”
  - giant language matrix table
  - no article/adoption markers
- If detected, throw a specific error like:
  `Fetched EUR-Lex shell page instead of CELEX text`

4. **Add URL fallback strategy for EUR-Lex fetch**
- Retry with alternate EUR-Lex URL variants when shell content is detected.
- Keep only the variant that reliably returns regulation body text for CELEX pages.

5. **Improve diagnostics in UI row errors**
- Include:
  - requested language
  - URL variant used
  - parser detected language
  - reason (`shell page`, `empty text`, `low parse`)
- This makes Batch All failures actionable without opening console logs.

Technical details
- Files to update:
  - `src/components/admin/BatchEurLexImporter.tsx`
  - `src/hooks/useAdaptiveParser.ts`
- Key logic adjustment:
  - `requestedLanguage` drives validation/error context.
  - `detectedLanguage` is informational only; never overwrite with `'en'` for user-facing errors.
- No database schema changes needed.

Validation plan
1. Run Batch on 3 languages first (`fr`, `es`, `it`).
2. Confirm errors (if any) no longer say detected `en` unless truly detected.
3. Confirm parser receives real regulation text (non-zero article/recital candidates).
4. Run full Batch All and verify stable counts + clearer per-language error reporting.

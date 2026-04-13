

## AI Assistant Knowledge Base Management

### Current Architecture

The AI Assistant does **not** use a trained model — it dynamically loads all content from the database into its system prompt on every request. This includes articles, recitals, definitions, chapters, implementing acts (with their articles/recitals/sections), FAQs, and official EHDS FAQs. So "retraining" means ensuring the knowledge base content is current and complete.

### What We Will Build

A new **"Knowledge Base"** tab on the existing AI Settings admin page that provides:

1. **Knowledge Base Status Dashboard** — A summary showing the count of each content type the AI has access to (articles, recitals, definitions, implementing acts with detailed content, FAQs, etc.) with visual indicators for completeness.

2. **Content Coverage Report** — Highlight implementing acts that have detailed content (articles/recitals) vs those that only have metadata, so you know where gaps exist.

3. **Knowledge Refresh Test** — A "Test Knowledge" button that sends a test query to the AI assistant and displays the response, letting you verify it knows about newly added content.

4. **Prompt Config Quick Stats** — Show which prompts are active/inactive and last updated dates.

### Technical Approach

- **File modified**: `src/pages/AdminAISettingsPage.tsx` — Add a new "Knowledge Base" tab
- **Queries**: Fetch counts from `articles`, `recitals`, `definitions`, `implementing_acts`, `implementing_act_articles`, `implementing_act_recitals`, `ehds_faqs`, `help_center_faq`, and `ai_prompt_config` tables
- **Test feature**: Invoke the `ehds-assistant` edge function with a configurable test prompt
- **No migrations needed** — all data already exists; this is a read-only dashboard with a test invoke feature

### UI Layout (Knowledge Base Tab)

- Grid of stat cards: Articles (count), Recitals (count), Definitions (count), Implementing Acts (total / with content), Official FAQs (count), Help Centre FAQs (count)
- Table listing implementing acts with columns: Title, Status, Has Articles, Has Recitals, Has Sections
- "Test AI Knowledge" section with a text input and response area
- Last-updated timestamps where available


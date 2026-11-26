import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_implementing_act",
  title: "Get implementing act",
  description: "Read one EHDS implementing act (e.g. 'art-15-1' for the EEHRxF exchange format): details, articles, recitals and its published data tables list.",
  inputSchema: {
    id: z.string().min(1).max(60).describe("Implementing act id, e.g. 'art-15-1'. Use list_implementing_acts to find ids."),
    include_text: z.boolean().optional().describe("Include full article and recital text (default true)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, include_text }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const db = supabaseForUser(ctx);
    const full = include_text !== false;
    const [act, articles, recitals, tables] = await Promise.all([
      db.from("implementing_acts").select("*").eq("id", id).maybeSingle(),
      db.from("implementing_act_articles").select(full ? "article_number, title, content" : "article_number, title").eq("implementing_act_id", id).order("article_number"),
      full ? db.from("implementing_act_recitals").select("recital_number, content").eq("implementing_act_id", id).order("recital_number") : Promise.resolve({ data: [], error: null }),
      db.from("implementing_act_data_tables").select("id, name, description").eq("implementing_act_id", id).eq("is_published", true).order("sort_order"),
    ]);
    const err = act.error ?? articles.error ?? recitals.error ?? tables.error;
    if (err) return { content: [{ type: "text" as const, text: err.message }], isError: true };
    if (!act.data) return { content: [{ type: "text" as const, text: `No implementing act with id '${id}'` }], isError: true };
    const result = JSON.parse(JSON.stringify({ act: act.data, articles: articles.data ?? [], recitals: recitals.data ?? [], data_tables: tables.data ?? [] }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
  },
});

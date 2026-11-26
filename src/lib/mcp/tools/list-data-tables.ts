import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "list_implementing_act_data_tables",
  title: "List implementing act data tables",
  description: "List published data tables from implementing acts (e.g. EEHRxF data sets in 'art-15-1'), with their columns.",
  inputSchema: {
    implementing_act_id: z.string().max(60).optional().describe("Only tables of this act, e.g. 'art-15-1' (EEHRxF)."),
    query: z.string().max(100).optional().describe("Filter by words in the table name or description."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ implementing_act_id, query }, ctx) =>
    runQuery(ctx, "tables", (db) => {
      let q = db.from("implementing_act_data_tables")
        .select("id, implementing_act_id, name, description, implementing_act_data_columns(name, column_key, sort_order)")
        .eq("is_published", true)
        .order("implementing_act_id").order("sort_order")
        .limit(200);
      if (implementing_act_id) q = q.eq("implementing_act_id", implementing_act_id);
      if (query) {
        const s = query.replace(/[%,()*]/g, " ").trim();
        if (s) q = q.or(`name.ilike.%${s}%,description.ilike.%${s}%`);
      }
      return q;
    }),
});

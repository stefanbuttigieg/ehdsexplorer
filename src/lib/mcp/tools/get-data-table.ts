import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_implementing_act_data_table",
  title: "Get implementing act data table",
  description: "Read a published implementing act data table (columns and rows in their set order), optionally keeping only rows containing a search term.",
  inputSchema: {
    table_id: z.string().uuid().describe("Table id from list_implementing_act_data_tables."),
    search: z.string().max(100).optional().describe("Keep only rows where any cell contains this text (case-insensitive)."),
    limit: z.number().int().min(1).max(1000).optional().describe("Maximum rows to return (default 500)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table_id, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text" as const, text: "Not authenticated" }], isError: true };
    const db = supabaseForUser(ctx);
    const t = await db.from("implementing_act_data_tables").select("id, implementing_act_id, name, description")
      .eq("id", table_id).eq("is_published", true).maybeSingle();
    if (t.error) return { content: [{ type: "text" as const, text: t.error.message }], isError: true };
    if (!t.data) return { content: [{ type: "text" as const, text: "Table not found or not published" }], isError: true };
    const [cols, rows] = await Promise.all([
      db.from("implementing_act_data_columns").select("name, column_key").eq("table_id", table_id).order("sort_order"),
      db.from("implementing_act_data_rows").select("values").eq("table_id", table_id).order("sort_order").limit(5000),
    ]);
    const err = cols.error ?? rows.error;
    if (err) return { content: [{ type: "text" as const, text: err.message }], isError: true };
    const needle = search?.toLowerCase();
    let list = (rows.data ?? []).map((r) => r.values);
    if (needle) list = list.filter((v) => JSON.stringify(v ?? {}).toLowerCase().includes(needle));
    const total = list.length;
    const max = limit ?? 500;
    const result = JSON.parse(JSON.stringify({ table: t.data, columns: cols.data ?? [], rows: list.slice(0, max), total_matching_rows: total, truncated: total > max }));
    return { content: [{ type: "text" as const, text: JSON.stringify(result) }], structuredContent: result };
  },
});

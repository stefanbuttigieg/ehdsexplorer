import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "search_definitions",
  title: "Search definitions",
  description: "Look up legal definitions (EHDS and related sources) by term.",
  inputSchema: {
    term: z.string().min(2).max(100).describe("Term to look up, e.g. 'electronic health record'."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ term, limit }, ctx) => {
    const q = term.replace(/[%,()]/g, " ");
    return runQuery(ctx, "definitions", (db) =>
      db.from("definitions")
        .select("term, definition, source, source_article")
        .ilike("term", `%${q}%`)
        .order("term")
        .limit(limit ?? 10),
    );
  },
});

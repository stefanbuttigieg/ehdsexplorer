import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "search_articles",
  title: "Search EHDS articles",
  description: "Search the articles of the EHDS Regulation (EU) 2025/327 by keyword in title or text.",
  inputSchema: {
    query: z.string().min(2).max(100).describe("Keyword or phrase, e.g. 'secondary use'."),
    limit: z.number().int().min(1).max(50).optional().describe("Maximum results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }, ctx) => {
    const q = query.replace(/[%,()]/g, " ");
    return runQuery(ctx, "articles", (db) =>
      db.from("articles")
        .select("article_number, title, content, chapter_id, is_key_provision")
        .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
        .order("article_number")
        .limit(limit ?? 10),
    );
  },
});

import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "get_article",
  title: "Get an EHDS article",
  description: "Get the full text of one EHDS Regulation article by its number.",
  inputSchema: { article_number: z.number().int().min(1).max(200).describe("Article number, e.g. 33.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ article_number }, ctx) =>
    runQuery(ctx, "articles", (db) =>
      db.from("articles")
        .select("article_number, title, content, chapter_id, section_id, stakeholder_tags, updated_at")
        .eq("article_number", article_number),
    ),
});

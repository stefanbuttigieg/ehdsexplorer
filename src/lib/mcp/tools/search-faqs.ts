import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "search_faqs",
  title: "Search official EHDS FAQs",
  description: "Search the European Commission's official EHDS FAQs by keyword in the question or answer.",
  inputSchema: {
    query: z.string().min(2).max(100).describe("Keyword or phrase."),
    limit: z.number().int().min(1).max(30).optional().describe("Maximum results (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ query, limit }, ctx) => {
    const q = query.replace(/[%,()]/g, " ");
    return runQuery(ctx, "faqs", (db) =>
      db.from("ehds_faqs")
        .select("faq_number, question, answer, chapter, source_articles, source_recitals")
        .eq("is_published", true)
        .or(`question.ilike.%${q}%,answer.ilike.%${q}%`)
        .order("faq_number")
        .limit(limit ?? 10),
    );
  },
});

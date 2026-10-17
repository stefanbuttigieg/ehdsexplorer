import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "list_implementing_acts",
  title: "List implementing acts",
  description: "List EHDS implementing and delegated acts, optionally filtered by status (e.g. 'feedback' for open consultations).",
  inputSchema: {
    status: z.string().max(40).optional().describe("Status filter, e.g. 'feedback', 'feedback-closed', 'adopted', 'pending'."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ status }, ctx) =>
    runQuery(ctx, "acts", (db) => {
      let q = db.from("implementing_acts")
        .select("id, article_reference, title, type, status, themes, feedback_deadline, adoption_date, related_articles, official_link, feedback_link")
        .order("article_reference")
        .limit(200);
      if (status) q = q.eq("status", status);
      return q;
    }),
});

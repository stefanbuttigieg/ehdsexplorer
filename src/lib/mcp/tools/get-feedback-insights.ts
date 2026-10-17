import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "get_feedback_insights",
  title: "Get public feedback insights",
  description: "Get the sentiment split, key themes and stakeholder breakdowns of public comments on an implementing act.",
  inputSchema: {
    act_id: z.string().min(1).max(60).optional().describe("Implementing act ID, e.g. 'art-75'. Omit for all acts."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ act_id }, ctx) =>
    runQuery(ctx, "insights", (db) => {
      let q = db.from("implementing_act_feedback_analysis")
        .select("implementing_act_id, total_count, analyzed_count, sentiment_counts, key_themes, themes_summary, by_user_type, by_country, last_synced_at")
        .limit(50);
      if (act_id) q = q.eq("implementing_act_id", act_id);
      return q;
    }),
});

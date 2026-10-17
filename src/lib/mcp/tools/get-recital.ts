import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { runQuery } from "../supabase";

export default defineTool({
  name: "get_recital",
  title: "Get an EHDS recital",
  description: "Get the text of one EHDS Regulation recital by number, with its related articles.",
  inputSchema: { recital_number: z.number().int().min(1).max(300).describe("Recital number, e.g. 12.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: ({ recital_number }, ctx) =>
    runQuery(ctx, "recitals", (db) =>
      db.from("recitals")
        .select("recital_number, content, related_articles, stakeholder_tags")
        .eq("recital_number", recital_number),
    ),
});

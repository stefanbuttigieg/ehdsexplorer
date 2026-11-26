import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchArticles from "./tools/search-articles";
import getArticle from "./tools/get-article";
import getRecital from "./tools/get-recital";
import searchDefinitions from "./tools/search-definitions";
import searchFaqs from "./tools/search-faqs";
import listImplementingActs from "./tools/list-implementing-acts";
import getFeedbackInsights from "./tools/get-feedback-insights";
import getImplementingAct from "./tools/get-implementing-act";
import listDataTables from "./tools/list-data-tables";
import getDataTable from "./tools/get-data-table";

// Vite inlines the stable ref; the published SUPABASE_URL may be a proxy.
const projectRef = import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "ehds-explorer",
  title: "EHDS Explorer",
  version: "0.2.0",
  instructions:
    "Tools for exploring the European Health Data Space Regulation (EU) 2025/327: search and read articles and recitals, look up definitions and official Commission FAQs, list implementing acts and read their full text, browse and read implementing act data tables (such as the EEHRxF data sets in act art-15-1), and read public feedback insights.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    resource: "https://mcp.ehdsexplorer.eu",
    acceptedAudiences: "authenticated",
  }),
  tools: [searchArticles, getArticle, getRecital, searchDefinitions, searchFaqs, listImplementingActs, getImplementingAct, listDataTables, getDataTable, getFeedbackInsights],
});

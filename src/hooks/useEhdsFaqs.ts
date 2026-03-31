import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EhdsFaq {
  id: string;
  faq_number: number;
  question: string;
  answer: string;
  rich_content: string | null;
  chapter: string;
  sub_category: string | null;
  source_articles: string[] | null;
  source_recitals: string[] | null;
  source_references: string | null;
  is_published: boolean;
  sort_order: number;
  pdf_version: string | null;
  document_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface EhdsFaqVersion {
  id: string;
  version_label: string;
  pdf_hash: string | null;
  pdf_url: string | null;
  release_date: string | null;
  notes: string | null;
  faqs_updated_count: number;
  created_at: string;
  updated_at: string;
}

export interface EhdsFaqFootnote {
  id: string;
  faq_id: string;
  marker: string;
  content: string;
  created_at: string;
}

export interface EhdsFaqSyncLog {
  id: string;
  pdf_url: string | null;
  pdf_hash: string | null;
  faqs_parsed: number | null;
  footnotes_parsed: number | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function useEhdsFaqs() {
  return useQuery({
    queryKey: ["ehds-faqs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faqs")
        .select("*")
        .eq("is_published", true)
        .order("faq_number");
      if (error) throw error;
      return data as EhdsFaq[];
    },
  });
}

export function useAllEhdsFaqs() {
  return useQuery({
    queryKey: ["ehds-faqs-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faqs")
        .select("*")
        .order("faq_number");
      if (error) throw error;
      return data as EhdsFaq[];
    },
  });
}

export function useEhdsFaqFootnotes(faqIds: string[]) {
  return useQuery({
    queryKey: ["ehds-faq-footnotes", faqIds],
    queryFn: async () => {
      if (faqIds.length === 0) return [];
      const { data, error } = await supabase
        .from("ehds_faq_footnotes")
        .select("*")
        .in("faq_id", faqIds)
        .order("marker");
      if (error) throw error;
      return data as EhdsFaqFootnote[];
    },
    enabled: faqIds.length > 0,
  });
}

export function useRelatedFaqs(articleNumber: number) {
  return useQuery({
    queryKey: ["related-faqs", articleNumber],
    queryFn: async () => {
      const artStr = String(articleNumber);
      const { data, error } = await supabase
        .from("ehds_faqs")
        .select("id, faq_number, question, chapter")
        .eq("is_published", true)
        .contains("source_articles", [artStr])
        .order("faq_number");
      if (error) throw error;
      return data as Pick<EhdsFaq, "id" | "faq_number" | "question" | "chapter">[];
    },
  });
}

export function useEhdsFaqSyncLogs() {
  return useQuery({
    queryKey: ["ehds-faq-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ehds_faq_sync_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as EhdsFaqSyncLog[];
    },
  });
}

// Get unique chapters from FAQs for navigation
export function getChaptersFromFaqs(faqs: EhdsFaq[]): { chapter: string; count: number; subCategories: string[] }[] {
  const chapterMap = new Map<string, { count: number; subCategories: Set<string> }>();
  for (const faq of faqs) {
    const existing = chapterMap.get(faq.chapter);
    if (existing) {
      existing.count++;
      if (faq.sub_category) existing.subCategories.add(faq.sub_category);
    } else {
      const subs = new Set<string>();
      if (faq.sub_category) subs.add(faq.sub_category);
      chapterMap.set(faq.chapter, { count: 1, subCategories: subs });
    }
  }
  return Array.from(chapterMap.entries()).map(([chapter, { count, subCategories }]) => ({
    chapter,
    count,
    subCategories: Array.from(subCategories),
  }));
}

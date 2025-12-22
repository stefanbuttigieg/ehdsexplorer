import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ImplementingActRecital {
  id: string;
  implementing_act_id: string;
  recital_number: number;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ImplementingActSection {
  id: string;
  implementing_act_id: string;
  section_number: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ImplementingActArticle {
  id: string;
  implementing_act_id: string;
  article_number: number;
  title: string;
  content: string;
  section_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useImplementingActRecitals = (implementingActId: string) => {
  return useQuery({
    queryKey: ["implementing-act-recitals", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_recitals")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .order("recital_number", { ascending: true });
      
      if (error) throw error;
      return data as ImplementingActRecital[];
    },
    enabled: !!implementingActId,
  });
};

export const useImplementingActSections = (implementingActId: string) => {
  return useQuery({
    queryKey: ["implementing-act-sections", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_sections")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .order("section_number", { ascending: true });
      
      if (error) throw error;
      return data as ImplementingActSection[];
    },
    enabled: !!implementingActId,
  });
};

export const useImplementingActArticles = (implementingActId: string) => {
  return useQuery({
    queryKey: ["implementing-act-articles", implementingActId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("implementing_act_articles")
        .select("*")
        .eq("implementing_act_id", implementingActId)
        .order("article_number", { ascending: true });
      
      if (error) throw error;
      return data as ImplementingActArticle[];
    },
    enabled: !!implementingActId,
  });
};

// Get articles grouped by section
export const groupArticlesBySection = (
  articles: ImplementingActArticle[],
  sections: ImplementingActSection[]
) => {
  const ungroupedArticles = articles.filter(a => !a.section_id);
  const sectionGroups = sections.map(section => ({
    section,
    articles: articles.filter(a => a.section_id === section.id),
  }));
  
  return { ungroupedArticles, sectionGroups };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PublishedWork {
  id: string;
  name: string;
  link: string;
  affiliated_organization: string;
  related_articles: number[];
  related_implementing_acts: string[];
  is_auto_discovered?: boolean;
  is_flagged?: boolean;
  flag_reason?: string;
  flagged_at?: string;
  flagged_by?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

export const usePublishedWorks = () => {
  return useQuery({
    queryKey: ["published-works"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_works")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as PublishedWork[];
    },
  });
};

export const usePublishedWork = (id: string) => {
  return useQuery({
    queryKey: ["published-work", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("published_works")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as PublishedWork | null;
    },
    enabled: !!id,
  });
};

export const getPublishedWorksByArticle = (
  works: PublishedWork[],
  articleNumber: number
): PublishedWork[] => {
  return works.filter((w) => w.related_articles.includes(articleNumber));
};

export const getPublishedWorksByImplementingAct = (
  works: PublishedWork[],
  actId: string
): PublishedWork[] => {
  return works.filter((w) => w.related_implementing_acts.includes(actId));
};

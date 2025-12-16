import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NewsSummary {
  id: string;
  title: string;
  summary: string;
  week_start: string;
  week_end: string;
  sources: string[];
  created_at: string;
  updated_at: string;
  generated_by: string;
  is_published: boolean;
}

export const useNewsSummaries = (publishedOnly = true) => {
  return useQuery({
    queryKey: ["news-summaries", publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from("news_summaries")
        .select("*")
        .order("week_start", { ascending: false });

      if (publishedOnly) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NewsSummary[];
    },
  });
};

export const useNewsSummary = (id: string) => {
  return useQuery({
    queryKey: ["news-summary", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_summaries")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as NewsSummary;
    },
    enabled: !!id,
  });
};

export const useGenerateNewsSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-news-summary");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-summaries"] });
    },
  });
};

export const useUpdateNewsSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewsSummary> & { id: string }) => {
      const { data, error } = await supabase
        .from("news_summaries")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-summaries"] });
    },
  });
};

export const useDeleteNewsSummary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("news_summaries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["news-summaries"] });
    },
  });
};

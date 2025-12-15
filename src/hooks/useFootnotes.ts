import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Footnote {
  id: string;
  marker: string;
  content: string;
  article_id: number | null;
  recital_id: number | null;
  created_at: string;
  updated_at: string;
}

export const useFootnotes = () => {
  return useQuery({
    queryKey: ["footnotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("footnotes")
        .select("*")
        .order("marker", { ascending: true });
      
      if (error) throw error;
      return data as Footnote[];
    },
  });
};

export const useFootnotesByArticle = (articleId: number | null) => {
  return useQuery({
    queryKey: ["footnotes", "article", articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const { data, error } = await supabase
        .from("footnotes")
        .select("*")
        .eq("article_id", articleId)
        .order("marker", { ascending: true });
      
      if (error) throw error;
      return data as Footnote[];
    },
    enabled: !!articleId,
  });
};

export const useFootnotesByRecital = (recitalId: number | null) => {
  return useQuery({
    queryKey: ["footnotes", "recital", recitalId],
    queryFn: async () => {
      if (!recitalId) return [];
      const { data, error } = await supabase
        .from("footnotes")
        .select("*")
        .eq("recital_id", recitalId)
        .order("marker", { ascending: true });
      
      if (error) throw error;
      return data as Footnote[];
    },
    enabled: !!recitalId,
  });
};

export const useCreateFootnote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (footnote: Omit<Footnote, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("footnotes")
        .insert(footnote)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footnotes"] });
    },
  });
};

export const useUpdateFootnote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Footnote> & { id: string }) => {
      const { data, error } = await supabase
        .from("footnotes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footnotes"] });
    },
  });
};

export const useDeleteFootnote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("footnotes")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footnotes"] });
    },
  });
};

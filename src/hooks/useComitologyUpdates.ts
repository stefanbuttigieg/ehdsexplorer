import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ComitologyUpdate {
  id: string;
  title: string;
  summary: string | null;
  source_url: string | null;
  scraped_content: string | null;
  scraped_at: string;
  created_at: string;
}

export const useLatestComitologyUpdate = () => {
  return useQuery({
    queryKey: ["comitology-updates", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comitology_updates")
        .select("*")
        .order("scraped_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ComitologyUpdate | null;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useRefreshComitologyUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("scrape-comitology-update");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comitology-updates"] });
    },
  });
};

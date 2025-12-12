import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Annex {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const useAnnexes = () => {
  return useQuery({
    queryKey: ['annexes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annexes')
        .select('*')
        .order('id');

      if (error) throw error;
      return data as Annex[];
    },
  });
};

export const useAnnex = (id: string) => {
  return useQuery({
    queryKey: ['annex', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annexes')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Annex | null;
    },
    enabled: !!id,
  });
};

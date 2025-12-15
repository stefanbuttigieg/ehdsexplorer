import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Recital {
  id: number;
  recital_number: number;
  content: string;
  related_articles: number[] | null;
  created_at: string;
  updated_at: string;
}

export const useRecitals = () => {
  return useQuery({
    queryKey: ["recitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recitals")
        .select("*")
        .order("recital_number", { ascending: true });
      
      if (error) throw error;
      return data as Recital[];
    },
  });
};

export const useRecital = (recitalNumber: number) => {
  return useQuery({
    queryKey: ["recital", recitalNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recitals")
        .select("*")
        .eq("recital_number", recitalNumber)
        .maybeSingle();
      
      if (error) throw error;
      return data as Recital | null;
    },
    enabled: !!recitalNumber,
  });
};

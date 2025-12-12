import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Definition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  created_at: string;
  updated_at: string;
}

export const useDefinitions = () => {
  return useQuery({
    queryKey: ["definitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("definitions")
        .select("*")
        .order("term", { ascending: true });

      if (error) throw error;
      return data as Definition[];
    },
  });
};

export const searchDefinitions = (definitions: Definition[], query: string): Definition[] => {
  const lowerQuery = query.toLowerCase();
  return definitions.filter(
    (def) =>
      def.term.toLowerCase().includes(lowerQuery) ||
      def.definition.toLowerCase().includes(lowerQuery)
  );
};

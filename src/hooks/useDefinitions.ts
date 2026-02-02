import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type DefinitionSource = 'ehds_regulation' | 'eu_ehr_glossary' | 'xt_ehr';

export interface Definition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  source: DefinitionSource | null;
  created_at: string;
  updated_at: string;
}

export const useDefinitions = (source?: DefinitionSource) => {
  return useQuery({
    queryKey: ["definitions", source],
    queryFn: async () => {
      let query = supabase
        .from("definitions")
        .select("*")
        .order("term", { ascending: true });

      if (source) {
        query = query.eq("source", source);
      }

      const { data, error } = await query;

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

export const getSourceLabel = (source: DefinitionSource | null): string => {
  switch (source) {
    case 'ehds_regulation':
      return 'EHDS Regulation';
    case 'eu_ehr_glossary':
      return 'EU EHR Database';
    case 'xt_ehr':
      return 'Xt-EHR';
    default:
      return 'EHDS Regulation';
  }
};

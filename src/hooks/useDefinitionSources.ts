import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DefinitionSource } from "./useDefinitions";

export interface DefinitionSourceRecord {
  id: string;
  definition_id: number;
  source: DefinitionSource;
  source_text: string;
  source_article: number | null;
  created_at: string;
  updated_at: string;
}

export const useDefinitionSources = (definitionId?: number) => {
  return useQuery({
    queryKey: ["definition-sources", definitionId],
    queryFn: async () => {
      if (!definitionId) return [];
      
      const { data, error } = await supabase
        .from("definition_sources")
        .select("*")
        .eq("definition_id", definitionId)
        .order("source", { ascending: true });

      if (error) throw error;
      return data as DefinitionSourceRecord[];
    },
    enabled: !!definitionId,
  });
};

export const useAllDefinitionSources = () => {
  return useQuery({
    queryKey: ["definition-sources", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("definition_sources")
        .select("*")
        .order("definition_id", { ascending: true });

      if (error) throw error;
      return data as DefinitionSourceRecord[];
    },
  });
};

export const useAddDefinitionSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      definition_id: number;
      source: DefinitionSource;
      source_text: string;
      source_article?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("definition_sources")
        .insert({
          definition_id: params.definition_id,
          source: params.source,
          source_text: params.source_text,
          source_article: params.source_article || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["definition-sources", variables.definition_id] });
      queryClient.invalidateQueries({ queryKey: ["definition-sources", "all"] });
    },
  });
};

export const useUpdateDefinitionSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      id: string;
      source_text: string;
      source_article?: number | null;
    }) => {
      const { data, error } = await supabase
        .from("definition_sources")
        .update({
          source_text: params.source_text,
          source_article: params.source_article,
        })
        .eq("id", params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["definition-sources"] });
    },
  });
};

export const useDeleteDefinitionSource = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("definition_sources")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["definition-sources"] });
    },
  });
};

// Helper to get sources grouped by definition
export const groupSourcesByDefinition = (sources: DefinitionSourceRecord[]) => {
  return sources.reduce((acc, source) => {
    if (!acc[source.definition_id]) {
      acc[source.definition_id] = [];
    }
    acc[source.definition_id].push(source);
    return acc;
  }, {} as Record<number, DefinitionSourceRecord[]>);
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CrossRegulationReference {
  id: string;
  article_id: number;
  regulation_name: string;
  regulation_short_name: string;
  provision_reference: string;
  provision_title: string | null;
  relationship_type: string;
  description: string | null;
  url: string | null;
  created_at: string;
}

export const useCrossRegulationReferences = (articleId?: number) => {
  return useQuery({
    queryKey: ["cross-regulation-references", articleId],
    queryFn: async () => {
      let query = supabase
        .from("cross_regulation_references" as any)
        .select("*")
        .order("regulation_short_name", { ascending: true });
      
      if (articleId !== undefined) {
        query = query.eq("article_id", articleId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return (data || []) as unknown as CrossRegulationReference[];
    },
    enabled: articleId !== undefined || articleId === undefined,
  });
};

export const useAllCrossRegulationReferences = () => {
  return useQuery({
    queryKey: ["cross-regulation-references", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cross_regulation_references" as any)
        .select("*")
        .order("article_id", { ascending: true });
      
      if (error) throw error;
      return (data || []) as unknown as CrossRegulationReference[];
    },
  });
};

// Group references by regulation for relationship map
export const groupByRegulation = (references: CrossRegulationReference[]) => {
  return references.reduce((acc, ref) => {
    if (!acc[ref.regulation_short_name]) {
      acc[ref.regulation_short_name] = {
        name: ref.regulation_name,
        shortName: ref.regulation_short_name,
        references: [],
      };
    }
    acc[ref.regulation_short_name].references.push(ref);
    return acc;
  }, {} as Record<string, { name: string; shortName: string; references: CrossRegulationReference[] }>);
};

// Get relationship type display info
export const getRelationshipInfo = (type: string) => {
  const types: Record<string, { label: string; color: string; description: string }> = {
    complements: {
      label: "Complements",
      color: "bg-blue-500",
      description: "Extends or adds to the provisions",
    },
    relates_to: {
      label: "Related",
      color: "bg-gray-500",
      description: "Has relevant connections",
    },
    specifies: {
      label: "Specifies",
      color: "bg-green-500",
      description: "Provides specific implementation details",
    },
    implements: {
      label: "Implements",
      color: "bg-purple-500",
      description: "Puts into practice",
    },
    aligns_with: {
      label: "Aligns",
      color: "bg-orange-500",
      description: "Shares similar requirements",
    },
  };
  
  return types[type] || { label: type, color: "bg-gray-400", description: "" };
};

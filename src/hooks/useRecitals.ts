import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStakeholder } from "@/contexts/StakeholderContext";
import { useMemo } from "react";

export interface Recital {
  id: number;
  recital_number: number;
  content: string;
  related_articles: number[] | null;
  stakeholder_tags: string[] | null;
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

// Hook that returns recitals filtered by current stakeholder
export const useFilteredRecitals = () => {
  const { data: recitals, isLoading, error } = useRecitals();
  const { activeStakeholder, isRelevantToStakeholder } = useStakeholder();

  const filteredRecitals = useMemo(() => {
    if (!recitals) return [];
    if (!activeStakeholder) return recitals;
    return recitals.filter(recital => isRelevantToStakeholder(recital.stakeholder_tags));
  }, [recitals, activeStakeholder, isRelevantToStakeholder]);

  return {
    recitals: filteredRecitals,
    allRecitals: recitals || [],
    isLoading,
    error,
    isFiltered: !!activeStakeholder,
    totalCount: recitals?.length || 0,
    filteredCount: filteredRecitals.length,
  };
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

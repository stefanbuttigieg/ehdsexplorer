import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ToolkitOption {
  value: string;
  label: string;
  description?: string;
}

export interface ToolkitQuestion {
  id: string;
  question: string;
  description: string | null;
  question_type: string;
  options: ToolkitOption[];
  sort_order: number;
  category: string;
}

export function useToolkitQuestions() {
  return useQuery({
    queryKey: ["toolkit-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("toolkit_questions")
        .select("*")
        .eq("is_active", true)
        .eq("category", "starter_kit")
        .order("sort_order");

      if (error) throw error;

      return (data ?? []).map((q) => ({
        ...q,
        options: (q.options as unknown as ToolkitOption[]) ?? [],
      })) as ToolkitQuestion[];
    },
  });
}

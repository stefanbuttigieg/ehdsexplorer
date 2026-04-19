import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HeaderItem {
  id: string;
  label: string;
  component_key: string;
  sort_order: number;
  is_visible: boolean;
  show_on_desktop: boolean;
  show_on_mobile: boolean;
  show_when_logged_in: boolean;
  show_when_logged_out: boolean;
  created_at: string;
  updated_at: string;
}

export function useHeaderItems() {
  return useQuery({
    queryKey: ["header-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("header_items" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as HeaderItem[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateHeaderItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<HeaderItem> }) => {
      const { error } = await supabase
        .from("header_items" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["header-items"] });
    },
  });
}

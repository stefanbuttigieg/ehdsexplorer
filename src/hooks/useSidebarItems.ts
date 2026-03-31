import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SidebarItem {
  id: string;
  label: string;
  path: string;
  icon_name: string;
  section: "main" | "legal" | "utility";
  sort_order: number;
  is_visible: boolean;
  feature_flag_id: string | null;
  requires_auth: boolean;
  open_external: boolean;
  created_at: string;
  updated_at: string;
}

export function useSidebarItems() {
  return useQuery({
    queryKey: ["sidebar-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sidebar_items" as any)
        .select("*")
        .eq("is_visible", true)
        .order("sort_order");
      if (error) throw error;
      return data as unknown as SidebarItem[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}

export function useAllSidebarItems() {
  return useQuery({
    queryKey: ["sidebar-items-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sidebar_items" as any)
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as unknown as SidebarItem[];
    },
  });
}

export function useUpdateSidebarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SidebarItem> }) => {
      const { error } = await supabase
        .from("sidebar_items" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sidebar-items"] });
      qc.invalidateQueries({ queryKey: ["sidebar-items-all"] });
    },
  });
}

export function useCreateSidebarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<SidebarItem>) => {
      const { error } = await supabase
        .from("sidebar_items" as any)
        .insert(item as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sidebar-items"] });
      qc.invalidateQueries({ queryKey: ["sidebar-items-all"] });
    },
  });
}

export function useDeleteSidebarItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sidebar_items" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sidebar-items"] });
      qc.invalidateQueries({ queryKey: ["sidebar-items-all"] });
    },
  });
}

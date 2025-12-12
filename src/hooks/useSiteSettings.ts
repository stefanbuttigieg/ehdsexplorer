import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  updated_at: string;
  updated_by: string | null;
}

export const useSiteSettings = () => {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "default")
        .single();

      if (error) throw error;
      return data as SiteSettings;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
};

export const useUpdateSiteSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Pick<SiteSettings, "maintenance_mode" | "maintenance_message">>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("site_settings")
        .update({
          ...settings,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq("id", "default")
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
};

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
      // Try the public view first
      const { data, error } = await supabase
        .from("site_settings_public")
        .select("*")
        .eq("id", "default")
        .maybeSingle();

      // If error or no data, return safe defaults
      if (error || !data) {
        console.warn('Could not fetch site settings, using defaults:', error?.message);
        return {
          id: 'default',
          maintenance_mode: false,
          maintenance_message: '',
          updated_at: new Date().toISOString(),
          updated_by: null
        } as SiteSettings;
      }
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

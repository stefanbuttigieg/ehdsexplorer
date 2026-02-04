import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface SEOSettings {
  id: string;
  page_path: string;
  page_title: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  twitter_card_type: string | null;
  canonical_url: string | null;
  noindex: boolean;
  nofollow: boolean;
  structured_data_type: string | null;
  custom_structured_data: Json | null;
  created_at: string;
  updated_at: string;
}

export type SEOSettingsInsert = Omit<SEOSettings, 'id' | 'created_at' | 'updated_at'>;
export type SEOSettingsUpdate = Partial<SEOSettingsInsert>;

export function useSEOSettings() {
  return useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .order('page_path');

      if (error) throw error;
      return data as SEOSettings[];
    },
  });
}

export function useSEOSettingsForPage(pagePath: string) {
  return useQuery({
    queryKey: ['seo-settings', pagePath],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('page_path', pagePath)
        .maybeSingle();

      if (error) throw error;
      return data as SEOSettings | null;
    },
    enabled: !!pagePath,
  });
}

export function useSEOSettingsMutations() {
  const queryClient = useQueryClient();

  const createSetting = useMutation({
    mutationFn: async (setting: SEOSettingsInsert) => {
      const { data, error } = await supabase
        .from('seo_settings')
        .insert([setting])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast.success('SEO settings created');
    },
    onError: (error) => {
      toast.error(`Failed to create SEO settings: ${error.message}`);
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ id, ...updates }: SEOSettingsUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('seo_settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast.success('SEO settings updated');
    },
    onError: (error) => {
      toast.error(`Failed to update SEO settings: ${error.message}`);
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('seo_settings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast.success('SEO settings deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete SEO settings: ${error.message}`);
    },
  });

  const upsertSetting = useMutation({
    mutationFn: async (setting: SEOSettingsInsert) => {
      const { data, error } = await supabase
        .from('seo_settings')
        .upsert([setting], { onConflict: 'page_path' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-settings'] });
      toast.success('SEO settings saved');
    },
    onError: (error) => {
      toast.error(`Failed to save SEO settings: ${error.message}`);
    },
  });

  return { createSetting, updateSetting, deleteSetting, upsertSetting };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useLanguages() {
  return useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as Language[];
    },
  });
}

export function useActiveLanguages() {
  return useQuery({
    queryKey: ['languages', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as Language[];
    },
  });
}

export function useUpdateLanguage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, updates }: { code: string; updates: Partial<Language> }) => {
      const { data, error } = await supabase
        .from('languages')
        .update(updates)
        .eq('code', code)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success('Language updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update language: ' + error.message);
    },
  });
}

export function useToggleLanguageActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ code, isActive }: { code: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('languages')
        .update({ is_active: isActive })
        .eq('code', code)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast.success(`${data.name} ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error) => {
      toast.error('Failed to toggle language: ' + error.message);
    },
  });
}

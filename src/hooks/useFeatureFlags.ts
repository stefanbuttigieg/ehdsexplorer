import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const useFeatureFlags = () => {
  const queryClient = useQueryClient();

  const { data: flags = [], isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as FeatureFlag[];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ is_enabled })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success(`${data.name} ${data.is_enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error) => {
      toast.error('Failed to update feature flag: ' + error.message);
    },
  });

  const updateFlag = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .update({ name, description })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag updated');
    },
    onError: (error) => {
      toast.error('Failed to update feature flag: ' + error.message);
    },
  });

  const createFlag = useMutation({
    mutationFn: async ({ id, name, description, is_enabled }: { id: string; name: string; description?: string; is_enabled?: boolean }) => {
      const { data, error } = await supabase
        .from('feature_flags')
        .insert({ id, name, description, is_enabled: is_enabled ?? true })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag created');
    },
    onError: (error) => {
      toast.error('Failed to create feature flag: ' + error.message);
    },
  });

  const deleteFlag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('feature_flags')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-flags'] });
      toast.success('Feature flag deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete feature flag: ' + error.message);
    },
  });

  // Helper to check if a specific feature is enabled
  const isFeatureEnabled = (featureId: string): boolean => {
    const flag = flags.find(f => f.id === featureId);
    return flag?.is_enabled ?? true; // Default to enabled if not found
  };

  return {
    flags,
    isLoading,
    error,
    toggleFlag,
    updateFlag,
    createFlag,
    deleteFlag,
    isFeatureEnabled,
  };
};

// Standalone hook for checking a single feature (more efficient for components)
export const useIsFeatureEnabled = (featureId: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags', featureId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('id', featureId)
        .maybeSingle();

      if (error) throw error;
      return data?.is_enabled ?? true; // Default to enabled if not found
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return {
    isEnabled: data ?? true,
    isLoading,
  };
};

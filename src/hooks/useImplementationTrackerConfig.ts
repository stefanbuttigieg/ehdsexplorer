import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ImplementationTrackerConfig {
  id: string;
  dha_weight: number;
  hdab_weight: number;
  legislation_weight: number;
  dha_active_value: number;
  dha_pending_value: number;
  dha_planned_value: number;
  dha_inactive_value: number;
  hdab_active_value: number;
  hdab_pending_value: number;
  hdab_planned_value: number;
  hdab_inactive_value: number;
  legislation_adopted_statuses: string[];
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ImplementationTrackerConfigUpdate = Partial<Omit<ImplementationTrackerConfig, 'id' | 'created_at' | 'updated_at'>>;

const DEFAULT_CONFIG: ImplementationTrackerConfig = {
  id: 'default',
  dha_weight: 33,
  hdab_weight: 33,
  legislation_weight: 34,
  dha_active_value: 100,
  dha_pending_value: 50,
  dha_planned_value: 25,
  dha_inactive_value: 0,
  hdab_active_value: 100,
  hdab_pending_value: 50,
  hdab_planned_value: 25,
  hdab_inactive_value: 0,
  legislation_adopted_statuses: ['adopted', 'in_force'],
  updated_by: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function useImplementationTrackerConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading, error } = useQuery({
    queryKey: ['implementation-tracker-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementation_tracker_config')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (error) throw error;
      
      // Return default config if none exists
      if (!data) return DEFAULT_CONFIG;
      
      return data as ImplementationTrackerConfig;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: ImplementationTrackerConfigUpdate) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('implementation_tracker_config')
        .update({ 
          ...updates,
          updated_by: user?.user?.id || null
        })
        .eq('id', 'default')
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['implementation-tracker-config'] });
      toast.success('Configuration updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update configuration: ${error.message}`);
    },
  });

  return {
    config: config || DEFAULT_CONFIG,
    isLoading,
    error,
    updateConfig,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MFASettings {
  id: string;
  enforcement_enabled: boolean;
  enforcement_start_date: string | null;
  grace_period_end_date: string | null;
  reminder_enabled: boolean;
  allowed_methods: string[];
  created_at: string;
  updated_at: string;
}

export function useMFASettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['mfa-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mfa_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      return data as MFASettings;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<MFASettings>) => {
      const { data, error } = await supabase
        .from('mfa_settings')
        .update(updates)
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      toast({
        title: 'Settings updated',
        description: 'MFA settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isEnforcementActive = settings?.enforcement_enabled && 
    settings?.grace_period_end_date && 
    new Date(settings.grace_period_end_date) < new Date();

  const isInGracePeriod = settings?.enforcement_enabled &&
    settings?.grace_period_end_date &&
    new Date(settings.grace_period_end_date) > new Date();

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    isEnforcementActive,
    isInGracePeriod,
  };
}

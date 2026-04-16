import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useEuRegulationUpdates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updatesQuery = useQuery({
    queryKey: ['eu-regulation-updates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eu_regulation_updates')
        .select('*')
        .order('detected_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const configQuery = useQuery({
    queryKey: ['eu-regulation-check-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eu_regulation_check_config')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, review_notes }: { id: string; status: string; review_notes?: string }) => {
      const { error } = await supabase
        .from('eu_regulation_updates')
        .update({ status, review_notes })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eu-regulation-updates'] });
      toast({ title: 'Status updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteUpdate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('eu_regulation_updates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eu-regulation-updates'] });
      toast({ title: 'Update deleted' });
    },
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: { check_times?: string[]; is_enabled?: boolean; target_url?: string }) => {
      const { data: existing } = await supabase
        .from('eu_regulation_check_config')
        .select('id')
        .limit(1)
        .single();
      if (!existing) throw new Error('No config found');
      const { error } = await supabase
        .from('eu_regulation_check_config')
        .update(updates)
        .eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eu-regulation-check-config'] });
      toast({ title: 'Configuration updated' });
    },
  });

  const triggerManualCheck = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-eu-regulation-updates');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['eu-regulation-updates'] });
      if (data?.changed) {
        toast({ title: 'Update detected!', description: 'A new change was found on the EU page.' });
      } else {
        toast({ title: 'No changes', description: 'The page content has not changed.' });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Check failed', description: err.message, variant: 'destructive' });
    },
  });

  return {
    updates: updatesQuery.data || [],
    isLoading: updatesQuery.isLoading,
    config: configQuery.data,
    configLoading: configQuery.isLoading,
    updateStatus,
    deleteUpdate,
    updateConfig,
    triggerManualCheck,
    newCount: (updatesQuery.data || []).filter(u => u.status === 'new').length,
  };
}

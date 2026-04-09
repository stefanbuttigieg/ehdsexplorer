import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ImplementingActChange {
  id: string;
  implementing_act_id: string;
  change_type: string;
  section_reference: string | null;
  original_text: string | null;
  revised_text: string | null;
  summary: string;
  is_significant: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const CHANGE_TYPES = [
  { value: 'addition', label: 'Addition' },
  { value: 'removal', label: 'Removal' },
  { value: 'modification', label: 'Modification' },
  { value: 'clarification', label: 'Clarification' },
];

export function useImplementingActChanges(actId: string | null) {
  return useQuery({
    queryKey: ['implementing-act-changes', actId],
    queryFn: async () => {
      if (!actId) return [];
      const { data, error } = await supabase
        .from('implementing_act_changes')
        .select('*')
        .eq('implementing_act_id', actId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as ImplementingActChange[];
    },
    enabled: !!actId,
  });
}

export function useCreateActChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<ImplementingActChange, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('implementing_act_changes')
        .insert([input])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['implementing-act-changes', vars.implementing_act_id] });
      toast.success('Change recorded');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateActChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, implementing_act_id, ...updates }: { id: string; implementing_act_id: string } & Partial<ImplementingActChange>) => {
      const { error } = await supabase
        .from('implementing_act_changes')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      return implementing_act_id;
    },
    onSuccess: (actId) => {
      qc.invalidateQueries({ queryKey: ['implementing-act-changes', actId] });
      toast.success('Change updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteActChange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, implementing_act_id }: { id: string; implementing_act_id: string }) => {
      const { error } = await supabase
        .from('implementing_act_changes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return implementing_act_id;
    },
    onSuccess: (actId) => {
      qc.invalidateQueries({ queryKey: ['implementing-act-changes', actId] });
      toast.success('Change deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

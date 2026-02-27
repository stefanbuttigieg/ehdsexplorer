import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LegislationObligationLink {
  id: string;
  legislation_id: string;
  obligation_id: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export const useLegislationObligationLinks = (legislationId?: string) => {
  return useQuery({
    queryKey: ['legislation-obligation-links', legislationId],
    queryFn: async () => {
      let query = supabase
        .from('legislation_obligation_links')
        .select('*')
        .order('created_at');

      if (legislationId) {
        query = query.eq('legislation_id', legislationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LegislationObligationLink[];
    },
  });
};

export const useCreateLegislationObligationLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: { legislation_id: string; obligation_id: string; notes?: string }) => {
      const { data, error } = await supabase
        .from('legislation_obligation_links')
        .insert(link)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-obligation-links'] });
    },
  });
};

export const useDeleteLegislationObligationLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('legislation_obligation_links')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legislation-obligation-links'] });
    },
  });
};

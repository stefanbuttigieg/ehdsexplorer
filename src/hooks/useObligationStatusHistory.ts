import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ObligationStatusHistory {
  id: string;
  country_code: string;
  obligation_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export const useObligationStatusHistory = (countryCode?: string, obligationId?: string) => {
  return useQuery({
    queryKey: ['obligation-status-history', countryCode, obligationId],
    queryFn: async () => {
      let query = supabase
        .from('obligation_status_history')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(50);

      if (countryCode) query = query.eq('country_code', countryCode);
      if (obligationId) query = query.eq('obligation_id', obligationId);

      const { data, error } = await query;
      if (error) throw error;
      return data as ObligationStatusHistory[];
    },
    enabled: !!countryCode,
  });
};

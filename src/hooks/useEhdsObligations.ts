import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ObligationCategory = 'primary_use' | 'secondary_use' | 'general';
export type ObligationStatus = 'not_started' | 'in_progress' | 'partial' | 'completed';

export interface EhdsObligation {
  id: string;
  category: ObligationCategory;
  name: string;
  description: string | null;
  article_references: string[];
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CountryObligationStatus {
  id: string;
  country_code: string;
  obligation_id: string;
  status: ObligationStatus;
  status_notes: string | null;
  evidence_url: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useEhdsObligations = () => {
  return useQuery({
    queryKey: ['ehds-obligations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ehds_obligations')
        .select('*')
        .order('category')
        .order('sort_order');
      
      if (error) throw error;
      return data as EhdsObligation[];
    },
  });
};

export const useCountryObligationStatuses = () => {
  return useQuery({
    queryKey: ['country-obligation-statuses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_obligation_status')
        .select('*');
      
      if (error) throw error;
      return data as CountryObligationStatus[];
    },
  });
};

export const useUpdateObligationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      country_code: string;
      obligation_id: string;
      status: ObligationStatus;
      status_notes?: string;
      evidence_url?: string;
    }) => {
      const { data, error } = await supabase
        .from('country_obligation_status')
        .upsert({
          country_code: params.country_code,
          obligation_id: params.obligation_id,
          status: params.status,
          status_notes: params.status_notes || null,
          evidence_url: params.evidence_url || null,
          last_verified_at: new Date().toISOString(),
        }, {
          onConflict: 'country_code,obligation_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-obligation-statuses'] });
    },
  });
};

export const useUpdateObligation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: Partial<EhdsObligation> & { id: string }) => {
      const { data, error } = await supabase
        .from('ehds_obligations')
        .update(params)
        .eq('id', params.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ehds-obligations'] });
    },
  });
};

export const CATEGORY_LABELS: Record<ObligationCategory, string> = {
  primary_use: 'Primary Use',
  secondary_use: 'Secondary Use',
  general: 'General',
};

export const STATUS_LABELS: Record<ObligationStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  partial: 'Partial',
  completed: 'Completed',
};

export const STATUS_COLORS: Record<ObligationStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  partial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

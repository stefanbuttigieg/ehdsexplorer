import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { LegislationStatus, LegislationType, EnforcementMeasure } from '@/data/legislationConstants';
import type { Json } from '@/integrations/supabase/types';

export interface CountryLegislation {
  id: string;
  country_code: string;
  country_name: string;
  title: string;
  official_title: string | null;
  url: string | null;
  language: string;
  summary: string | null;
  draft_date: string | null;
  tabled_date: string | null;
  adoption_date: string | null;
  publication_date: string | null;
  effective_date: string | null;
  ehds_articles_referenced: number[];
  implementing_act_ids: string[];
  legislation_type: LegislationType;
  status: LegislationStatus;
  status_notes: string | null;
  enforcement_measures: EnforcementMeasure[];
  enforcement_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateLegislationInput {
  country_code: string;
  country_name: string;
  title: string;
  official_title?: string;
  url?: string;
  language?: string;
  summary?: string;
  draft_date?: string;
  tabled_date?: string;
  adoption_date?: string;
  publication_date?: string;
  effective_date?: string;
  ehds_articles_referenced?: number[];
  implementing_act_ids?: string[];
  legislation_type?: LegislationType;
  status?: LegislationStatus;
  status_notes?: string;
  enforcement_measures?: string[];
  enforcement_details?: Json;
}

export function useCountryLegislation() {
  return useQuery({
    queryKey: ['country-legislation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('country_legislation')
        .select('*')
        .order('country_name', { ascending: true });

      if (error) throw error;
      return data as CountryLegislation[];
    }
  });
}

export function useLegislationByCountry(countryCode: string | null) {
  return useQuery({
    queryKey: ['country-legislation', 'country', countryCode],
    queryFn: async () => {
      if (!countryCode) return [];
      
      const { data, error } = await supabase
        .from('country_legislation')
        .select('*')
        .eq('country_code', countryCode)
        .order('status', { ascending: true });

      if (error) throw error;
      return data as CountryLegislation[];
    },
    enabled: !!countryCode
  });
}

export function useLegislationByArticle(articleNumber: number | null) {
  return useQuery({
    queryKey: ['country-legislation', 'article', articleNumber],
    queryFn: async () => {
      if (!articleNumber) return [];
      
      const { data, error } = await supabase
        .from('country_legislation')
        .select('*')
        .contains('ehds_articles_referenced', [articleNumber])
        .order('country_name', { ascending: true });

      if (error) throw error;
      return data as CountryLegislation[];
    },
    enabled: !!articleNumber
  });
}

export function useLegislationByImplementingAct(actId: string | null) {
  return useQuery({
    queryKey: ['country-legislation', 'implementing-act', actId],
    queryFn: async () => {
      if (!actId) return [];
      
      const { data, error } = await supabase
        .from('country_legislation')
        .select('*')
        .contains('implementing_act_ids', [actId])
        .order('country_name', { ascending: true });

      if (error) throw error;
      return data as CountryLegislation[];
    },
    enabled: !!actId
  });
}

export function useLegislationByStatus(status: LegislationStatus | null) {
  return useQuery({
    queryKey: ['country-legislation', 'status', status],
    queryFn: async () => {
      if (!status) return [];
      
      const { data, error } = await supabase
        .from('country_legislation')
        .select('*')
        .eq('status', status)
        .order('country_name', { ascending: true });

      if (error) throw error;
      return data as CountryLegislation[];
    },
    enabled: !!status
  });
}

export function useCreateLegislation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLegislationInput) => {
      const { data, error } = await supabase
        .from('country_legislation')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data as CountryLegislation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-legislation'] });
      toast.success('Legislation created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create legislation: ' + error.message);
    }
  });
}

export function useUpdateLegislation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<CreateLegislationInput>) => {
      const { data, error } = await supabase
        .from('country_legislation')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as CountryLegislation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-legislation'] });
      toast.success('Legislation updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update legislation: ' + error.message);
    }
  });
}

export function useDeleteLegislation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('country_legislation')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-legislation'] });
      toast.success('Legislation deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete legislation: ' + error.message);
    }
  });
}

// Helper function to get legislation statistics
export function getLegislationStats(legislation: CountryLegislation[]) {
  const stats = {
    total: legislation.length,
    byStatus: {} as Record<LegislationStatus, number>,
    byType: {} as Record<LegislationType, number>,
    countriesWithLegislation: new Set<string>(),
    countriesWithEnforcement: new Set<string>()
  };

  legislation.forEach(leg => {
    // Count by status
    stats.byStatus[leg.status] = (stats.byStatus[leg.status] || 0) + 1;
    
    // Count by type
    stats.byType[leg.legislation_type] = (stats.byType[leg.legislation_type] || 0) + 1;
    
    // Track countries
    stats.countriesWithLegislation.add(leg.country_code);
    
    if (leg.enforcement_measures && leg.enforcement_measures.length > 0) {
      stats.countriesWithEnforcement.add(leg.country_code);
    }
  });

  return {
    ...stats,
    countriesWithLegislation: stats.countriesWithLegislation.size,
    countriesWithEnforcement: stats.countriesWithEnforcement.size
  };
}

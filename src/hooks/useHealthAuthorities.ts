import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type AuthorityType = 'digital_health_authority' | 'health_data_access_body';
export type AuthorityStatus = 'active' | 'pending' | 'planned' | 'inactive';

export interface KeyContact {
  name: string;
  role: string;
  email?: string;
}

export interface NewsUpdate {
  date: string;
  title: string;
  content: string;
}

export interface HealthAuthority {
  id: string;
  name: string;
  country_code: string;
  country_name: string;
  authority_type: AuthorityType;
  status: AuthorityStatus;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  ehds_role?: string;
  key_contacts: KeyContact[];
  related_legislation?: string[];
  news_updates: NewsUpdate[];
  logo_url?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export type HealthAuthorityInsert = Omit<HealthAuthority, 'id' | 'created_at' | 'updated_at'>;
export type HealthAuthorityUpdate = Partial<HealthAuthorityInsert>;

export function useHealthAuthorities() {
  const queryClient = useQueryClient();

  const { data: authorities, isLoading, error } = useQuery({
    queryKey: ['health-authorities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('health_authorities')
        .select('*')
        .order('country_name', { ascending: true });

      if (error) throw error;
      
      // Transform JSONB fields to typed arrays
      return (data || []).map(a => ({
        ...a,
        key_contacts: (a.key_contacts as unknown as KeyContact[]) || [],
        news_updates: (a.news_updates as unknown as NewsUpdate[]) || [],
      })) as HealthAuthority[];
    },
  });

  const createAuthority = useMutation({
    mutationFn: async (authority: HealthAuthorityInsert) => {
      const payload = {
        ...authority,
        key_contacts: JSON.parse(JSON.stringify(authority.key_contacts || [])),
        news_updates: JSON.parse(JSON.stringify(authority.news_updates || [])),
      };
      
      const { data, error } = await supabase
        .from('health_authorities')
        .insert(payload as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-authorities'] });
      toast({
        title: "Authority created",
        description: "The health authority has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAuthority = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: HealthAuthorityUpdate }) => {
      const { data, error } = await supabase
        .from('health_authorities')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-authorities'] });
      toast({
        title: "Authority updated",
        description: "The health authority has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAuthority = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('health_authorities')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-authorities'] });
      toast({
        title: "Authority deleted",
        description: "The health authority has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions for filtering
  const getByType = (type: AuthorityType) => 
    authorities?.filter(a => a.authority_type === type) || [];

  const getByCountry = (countryCode: string) => 
    authorities?.filter(a => a.country_code === countryCode) || [];

  const getByStatus = (status: AuthorityStatus) => 
    authorities?.filter(a => a.status === status) || [];

  return {
    authorities,
    isLoading,
    error,
    createAuthority,
    updateAuthority,
    deleteAuthority,
    getByType,
    getByCountry,
    getByStatus,
  };
}

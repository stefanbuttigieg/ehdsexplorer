import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface CountryAssignment {
  id: string;
  user_id: string;
  country_code: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface CountryAssignmentWithProfile extends CountryAssignment {
  profile?: {
    display_name: string | null;
    email: string | null;
  };
  assigned_by_profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export const useCountryAssignments = () => {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all country assignments (admin only)
  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['country-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_country_assignments')
        .select('*')
        .order('country_code', { ascending: true });

      if (error) throw error;

      // Fetch profiles for each assignment
      const assignmentsWithProfiles: CountryAssignmentWithProfile[] = await Promise.all(
        (data || []).map(async (assignment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', assignment.user_id)
            .maybeSingle();

          let assignedByProfile = null;
          if (assignment.assigned_by) {
            const { data: abp } = await supabase
              .from('profiles')
              .select('display_name, email')
              .eq('user_id', assignment.assigned_by)
              .maybeSingle();
            assignedByProfile = abp;
          }

          return {
            ...assignment,
            profile: profile || undefined,
            assigned_by_profile: assignedByProfile || undefined,
          };
        })
      );

      return assignmentsWithProfiles;
    },
    enabled: !!user && isAdmin,
  });

  // Fetch assignments for a specific country
  const useAssignmentsByCountry = (countryCode: string) => {
    return useQuery({
      queryKey: ['country-assignments', countryCode],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('user_country_assignments')
          .select('*')
          .eq('country_code', countryCode);

        if (error) throw error;
        return data || [];
      },
      enabled: !!user && !!countryCode,
    });
  };

  // Fetch countries assigned to current user
  const { data: myAssignedCountries = [] } = useQuery({
    queryKey: ['my-country-assignments', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_country_assignments')
        .select('country_code')
        .eq('user_id', user.id);

      if (error) throw error;
      return (data || []).map(d => d.country_code);
    },
    enabled: !!user,
  });

  // Assign a user to a country
  const assignUser = useMutation({
    mutationFn: async ({ userId, countryCode }: { userId: string; countryCode: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_country_assignments')
        .insert({
          user_id: userId,
          country_code: countryCode,
          assigned_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-assignments'] });
      toast.success('User assigned to country successfully');
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('User is already assigned to this country');
      } else {
        toast.error('Failed to assign user: ' + error.message);
      }
    },
  });

  // Remove a user from a country
  const removeAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('user_country_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-assignments'] });
      toast.success('Assignment removed');
    },
    onError: (error: Error) => {
      toast.error('Failed to remove assignment: ' + error.message);
    },
  });

  // Bulk assign user to multiple countries
  const bulkAssignCountries = useMutation({
    mutationFn: async ({ userId, countryCodes }: { userId: string; countryCodes: string[] }) => {
      if (!user) throw new Error('Not authenticated');

      const assignments = countryCodes.map(countryCode => ({
        user_id: userId,
        country_code: countryCode,
        assigned_by: user.id,
      }));

      const { data, error } = await supabase
        .from('user_country_assignments')
        .upsert(assignments, { onConflict: 'user_id,country_code' })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['country-assignments'] });
      toast.success('Countries assigned successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to assign countries: ' + error.message);
    },
  });

  return {
    assignments,
    isLoading,
    myAssignedCountries,
    useAssignmentsByCountry,
    assignUser,
    removeAssignment,
    bulkAssignCountries,
    isAdmin,
  };
};

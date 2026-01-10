import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TeamActivity {
  id: string;
  team_id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export const useTeamActivity = (teamId: string | null) => {
  const { user } = useAuth();

  const { data: activities = [], isLoading: activitiesLoading, refetch } = useQuery({
    queryKey: ['team-activity', teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data, error } = await supabase
        .from('team_activity')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profiles for each activity
      const activitiesWithProfiles: TeamActivity[] = await Promise.all(
        (data || []).map(async (activity) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', activity.user_id)
            .single();

          return {
            ...activity,
            metadata: activity.metadata as Record<string, unknown> | null,
            profile: profile || undefined,
          };
        })
      );

      return activitiesWithProfiles;
    },
    enabled: !!teamId && !!user,
  });

  return {
    activities,
    activitiesLoading,
    refetchActivities: refetch,
  };
};

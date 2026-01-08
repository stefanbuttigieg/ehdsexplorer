import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface TeamMemberWithProfile extends TeamMembership {
  profile?: {
    display_name: string | null;
    email: string | null;
  };
}

export interface TeamWithMembership extends Team {
  membership?: TeamMembership;
  member_count?: number;
}

interface CreateTeamInput {
  name: string;
  description?: string;
}

interface UpdateTeamInput {
  id: string;
  name?: string;
  description?: string;
}

interface InviteMemberInput {
  teamId: string;
  email: string;
  role: TeamRole;
}

interface UpdateMemberRoleInput {
  teamId: string;
  userId: string;
  role: TeamRole;
}

export const useTeams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all teams the user belongs to
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['teams', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: memberships, error: membershipError } = await supabase
        .from('team_memberships')
        .select('team_id, role')
        .eq('user_id', user.id);

      if (membershipError) throw membershipError;
      if (!memberships || memberships.length === 0) return [];

      const teamIds = memberships.map(m => m.team_id);
      
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .in('id', teamIds);

      if (teamsError) throw teamsError;

      // Get member counts for each team
      const teamsWithMembership: TeamWithMembership[] = await Promise.all(
        (teamsData || []).map(async (team) => {
          const membership = memberships.find(m => m.team_id === team.id);
          
          const { count } = await supabase
            .from('team_memberships')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          return {
            ...team,
            membership: membership ? {
              id: '',
              team_id: team.id,
              user_id: user.id,
              role: membership.role as TeamRole,
              joined_at: '',
            } : undefined,
            member_count: count || 0,
          };
        })
      );

      return teamsWithMembership;
    },
    enabled: !!user,
  });

  // Create a new team
  const createTeam = useMutation({
    mutationFn: async (input: CreateTeamInput) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: input.name,
          description: input.description || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create team: ' + error.message);
    },
  });

  // Update a team
  const updateTeam = useMutation({
    mutationFn: async (input: UpdateTeamInput) => {
      const updateData: Partial<Team> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;

      const { data, error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) throw error;
      return data as Team;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update team: ' + error.message);
    },
  });

  // Delete a team
  const deleteTeam = useMutation({
    mutationFn: async (teamId: string) => {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Team deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete team: ' + error.message);
    },
  });

  return {
    teams,
    teamsLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    isLoggedIn: !!user,
  };
};

export const useTeamMembers = (teamId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch team members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      if (!teamId) return [];

      const { data: memberships, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId);

      if (error) throw error;

      // Get profiles for each member
      const membersWithProfiles: TeamMemberWithProfile[] = await Promise.all(
        (memberships || []).map(async (membership) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, email')
            .eq('user_id', membership.user_id)
            .single();

          return {
            ...membership,
            role: membership.role as TeamRole,
            profile: profile || undefined,
          };
        })
      );

      return membersWithProfiles;
    },
    enabled: !!teamId && !!user,
  });

  // Invite a member by email
  const inviteMember = useMutation({
    mutationFn: async (input: InviteMemberInput) => {
      // First find the user by email in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', input.email)
        .single();

      if (profileError || !profile) {
        throw new Error('User not found with that email address');
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('team_memberships')
        .select('id')
        .eq('team_id', input.teamId)
        .eq('user_id', profile.user_id)
        .single();

      if (existing) {
        throw new Error('User is already a member of this team');
      }

      // Add the member
      const { data, error } = await supabase
        .from('team_memberships')
        .insert({
          team_id: input.teamId,
          user_id: profile.user_id,
          role: input.role,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('team_activity').insert({
        team_id: input.teamId,
        user_id: user!.id,
        action: 'invited_member',
        entity_type: 'membership',
        entity_id: data.id,
        metadata: { invited_email: input.email, role: input.role },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member invited successfully');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update member role
  const updateMemberRole = useMutation({
    mutationFn: async (input: UpdateMemberRoleInput) => {
      const { data, error } = await supabase
        .from('team_memberships')
        .update({ role: input.role })
        .eq('team_id', input.teamId)
        .eq('user_id', input.userId)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await supabase.from('team_activity').insert({
        team_id: input.teamId,
        user_id: user!.id,
        action: 'updated_role',
        entity_type: 'membership',
        metadata: { target_user_id: input.userId, new_role: input.role },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Member role updated');
    },
    onError: (error) => {
      toast.error('Failed to update role: ' + error.message);
    },
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log activity
      await supabase.from('team_activity').insert({
        team_id: teamId,
        user_id: user!.id,
        action: 'removed_member',
        entity_type: 'membership',
        metadata: { removed_user_id: userId },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Member removed');
    },
    onError: (error) => {
      toast.error('Failed to remove member: ' + error.message);
    },
  });

  // Leave team
  const leaveTeam = useMutation({
    mutationFn: async (teamId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      toast.success('You have left the team');
    },
    onError: (error) => {
      toast.error('Failed to leave team: ' + error.message);
    },
  });

  return {
    members,
    membersLoading,
    inviteMember,
    updateMemberRole,
    removeMember,
    leaveTeam,
    currentUserId: user?.id,
  };
};

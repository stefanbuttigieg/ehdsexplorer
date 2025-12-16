import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = 'super_admin' | 'admin' | 'editor';

export interface RolePermission {
  id: string;
  role: AppRole;
  content_type: string;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
}

export const CONTENT_TYPES = [
  { id: 'articles', label: 'Articles' },
  { id: 'recitals', label: 'Recitals' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'annexes', label: 'Annexes' },
  { id: 'implementing_acts', label: 'Implementing Acts' },
  { id: 'chapters', label: 'Chapters & Sections' },
  { id: 'footnotes', label: 'Footnotes' },
  { id: 'news_summaries', label: 'News Summaries' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'published_works', label: 'Published Works' },
  { id: 'joint_action_deliverables', label: 'Joint Action Deliverables' },
] as const;

export const ROLES: { id: AppRole; label: string; description: string }[] = [
  { id: 'super_admin', label: 'Super Admin', description: 'Full access to everything including user management and system settings' },
  { id: 'admin', label: 'Admin', description: 'Full content management with configurable permissions' },
  { id: 'editor', label: 'Editor', description: 'Limited content editing with configurable permissions' },
];

export const useRolePermissions = () => {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .order("role")
        .order("content_type");

      if (error) throw error;
      return data as RolePermission[];
    },
  });
};

export const useUpdateRolePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RolePermission> & { id: string }) => {
      const { data, error } = await supabase
        .from("role_permissions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["role-permissions"] });
    },
  });
};

export const useUserRoleInfo = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-role-info", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No role found
        throw error;
      }
      return data?.role as AppRole | null;
    },
    enabled: !!userId,
  });
};

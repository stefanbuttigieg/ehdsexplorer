import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export interface UpdatePermissionInput {
  id: string;
  can_create?: boolean;
  can_edit?: boolean;
  can_delete?: boolean;
  can_publish?: boolean;
}

export interface CreatePermissionInput {
  role: AppRole;
  content_type: string;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_publish: boolean;
}

// Content types that can have permissions
export const CONTENT_TYPES = [
  { id: 'articles', label: 'Articles' },
  { id: 'recitals', label: 'Recitals' },
  { id: 'definitions', label: 'Definitions' },
  { id: 'annexes', label: 'Annexes' },
  { id: 'chapters', label: 'Chapters' },
  { id: 'sections', label: 'Sections' },
  { id: 'implementing_acts', label: 'Implementing Acts' },
  { id: 'news_summaries', label: 'News' },
  { id: 'translations', label: 'Translations' },
  { id: 'footnotes', label: 'Footnotes' },
  { id: 'health_authorities', label: 'Health Authorities' },
  { id: 'country_legislation', label: 'Country Legislation' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'users', label: 'Users' },
  { id: 'joint_action_deliverables', label: 'EU Project Deliverables' },
  { id: 'published_works', label: 'Published Works' },
  { id: 'cross_regulation', label: 'Cross-Regulation References' },
  { id: 'plain_language', label: 'Plain Language Translations' },
  { id: 'help_center', label: 'Help Center FAQs' },
  { id: 'onboarding', label: 'Onboarding Steps' },
  { id: 'email_templates', label: 'Email Templates' },
] as const;

export const ROLES: { id: AppRole; label: string; description: string }[] = [
  { 
    id: 'super_admin', 
    label: 'Super Admin', 
    description: 'Full system access - bypasses all permission checks' 
  },
  { 
    id: 'admin', 
    label: 'Admin', 
    description: 'Administrative access with configurable permissions' 
  },
  { 
    id: 'editor', 
    label: 'Editor', 
    description: 'Content editing access with configurable permissions' 
  },
];

export const useRolePermissions = () => {
  const queryClient = useQueryClient();

  // Fetch all permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['role-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role')
        .order('content_type');

      if (error) throw error;
      return data as RolePermission[];
    },
  });

  // Group permissions by role
  const permissionsByRole = permissions.reduce((acc, perm) => {
    if (!acc[perm.role]) {
      acc[perm.role] = [];
    }
    acc[perm.role].push(perm);
    return acc;
  }, {} as Record<AppRole, RolePermission[]>);

  // Update a permission
  const updatePermission = useMutation({
    mutationFn: async (input: UpdatePermissionInput) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('role_permissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission updated');
    },
    onError: (error) => {
      toast.error('Failed to update permission: ' + error.message);
    },
  });

  // Bulk update permissions for a role
  const bulkUpdatePermissions = useMutation({
    mutationFn: async (updates: UpdatePermissionInput[]) => {
      const results = await Promise.all(
        updates.map(async ({ id, ...rest }) => {
          const { data, error } = await supabase
            .from('role_permissions')
            .update(rest)
            .eq('id', id)
            .select()
            .single();
          
          if (error) throw error;
          return data;
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permissions updated');
    },
    onError: (error) => {
      toast.error('Failed to update permissions: ' + error.message);
    },
  });

  // Create a new permission
  const createPermission = useMutation({
    mutationFn: async (input: CreatePermissionInput) => {
      const { data, error } = await supabase
        .from('role_permissions')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission created');
    },
    onError: (error) => {
      toast.error('Failed to create permission: ' + error.message);
    },
  });

  // Delete a permission
  const deletePermission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast.success('Permission deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete permission: ' + error.message);
    },
  });

  // Get permission for a specific role and content type
  const getPermission = (role: AppRole, contentType: string) => {
    return permissions.find(
      (p) => p.role === role && p.content_type === contentType
    );
  };

  // Check if a role has a specific permission
  const hasPermission = (
    role: AppRole,
    contentType: string,
    action: 'create' | 'edit' | 'delete' | 'publish'
  ): boolean => {
    if (role === 'super_admin') return true;
    
    const perm = getPermission(role, contentType);
    if (!perm) return false;

    switch (action) {
      case 'create':
        return perm.can_create;
      case 'edit':
        return perm.can_edit;
      case 'delete':
        return perm.can_delete;
      case 'publish':
        return perm.can_publish;
      default:
        return false;
    }
  };

  return {
    permissions,
    permissionsByRole,
    isLoading,
    updatePermission,
    bulkUpdatePermissions,
    createPermission,
    deletePermission,
    getPermission,
    hasPermission,
  };
};

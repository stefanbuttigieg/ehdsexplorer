import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface UseAdminGuardOptions {
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

/**
 * Hook for admin page access control.
 * Redirects to auth page if not logged in, or home if not an editor.
 * If requireAdmin is true, also checks for admin role (not just editor).
 * If requireSuperAdmin is true, checks for super_admin role.
 * Returns loading state and whether to render content.
 */
export function useAdminGuard(options: UseAdminGuardOptions = {}) {
  const { requireAdmin = false, requireSuperAdmin = false } = options;
  const { user, loading, isEditor, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    } else if (!loading && user && requireSuperAdmin && !isSuperAdmin) {
      navigate('/admin');
    } else if (!loading && user && requireAdmin && !isAdmin) {
      navigate('/admin');
    }
  }, [user, loading, isEditor, isAdmin, isSuperAdmin, requireAdmin, requireSuperAdmin, navigate]);

  const shouldRender = !loading && !!user && isEditor && 
    (!requireAdmin || isAdmin) && 
    (!requireSuperAdmin || isSuperAdmin);

  return {
    user,
    loading,
    isLoading: loading,
    isEditor,
    isAdmin,
    isSuperAdmin,
    shouldRender,
  };
}

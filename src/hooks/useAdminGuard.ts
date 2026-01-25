import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface UseAdminGuardOptions {
  requireAdmin?: boolean;
}

/**
 * Hook for admin page access control.
 * Redirects to auth page if not logged in, or home if not an editor.
 * If requireAdmin is true, also checks for admin role (not just editor).
 * Returns loading state and whether to render content.
 */
export function useAdminGuard(options: UseAdminGuardOptions = {}) {
  const { requireAdmin = false } = options;
  const { user, loading, isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    } else if (!loading && user && requireAdmin && !isAdmin) {
      navigate('/admin');
    }
  }, [user, loading, isEditor, isAdmin, requireAdmin, navigate]);

  const shouldRender = !loading && !!user && isEditor && (!requireAdmin || isAdmin);

  return {
    user,
    loading,
    isLoading: loading,
    isEditor,
    isAdmin,
    shouldRender,
  };
}

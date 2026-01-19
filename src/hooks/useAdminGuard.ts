import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for admin page access control.
 * Redirects to auth page if not logged in, or home if not an editor.
 * Returns loading state and whether to render content.
 */
export function useAdminGuard() {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  const shouldRender = !loading && !!user && isEditor;

  return {
    user,
    loading,
    isEditor,
    shouldRender,
  };
}

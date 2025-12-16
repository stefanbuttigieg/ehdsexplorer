import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  const checkRoles = useCallback(async (userId: string) => {
    setRolesLoading(true);
    console.log('[useAuth] Checking roles for user:', userId);
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      console.log('[useAuth] Roles query result:', { data, error });
      
      if (error) {
        console.error('[useAuth] Error checking roles:', error);
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setIsEditor(false);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      console.log('[useAuth] Roles found:', roles);
      
      const hasSuperAdmin = roles.includes('super_admin');
      const hasAdmin = roles.includes('admin');
      const hasEditor = roles.includes('editor');
      
      setIsSuperAdmin(hasSuperAdmin);
      setIsAdmin(hasAdmin || hasSuperAdmin);
      setIsEditor(hasEditor || hasAdmin || hasSuperAdmin);
      
      console.log('[useAuth] Role states set:', { hasSuperAdmin, hasAdmin, hasEditor });
    } catch (err) {
      console.error('[useAuth] Error checking roles:', err);
      setIsSuperAdmin(false);
      setIsAdmin(false);
      setIsEditor(false);
    } finally {
      setRolesLoading(false);
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role check with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            checkRoles(session.user.id);
          }, 0);
        } else {
          setIsSuperAdmin(false);
          setIsAdmin(false);
          setIsEditor(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkRoles(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkRoles]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/admin`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl }
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    isSuperAdmin,
    isAdmin,
    isEditor,
    signIn,
    signUp,
    signOut,
  };
}

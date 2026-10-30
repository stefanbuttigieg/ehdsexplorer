import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditor, setIsEditor] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaError, setMfaError] = useState(false);

  const checkRoles = useCallback(async (userId: string) => {
    setRolesLoading(true);
    try {
      const { data: verifiedUser, error: userError } = await supabase.auth.getUser();
      if (userError || verifiedUser.user?.id !== userId) throw new Error('Session validation failed');
      const { data: verified, error: verificationError } = await supabase.rpc('is_mfa_session_verified');
      if (verificationError) throw verificationError;
      setMfaRequired(verified !== true);
      setMfaError(false);
      if (verified !== true) {
        setIsAdmin(false);
        setIsEditor(false);
        setIsSuperAdmin(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      
      if (error) {
        console.error('Error checking roles:', error);
        setIsAdmin(false);
        setIsEditor(false);
        setIsSuperAdmin(false);
        return;
      }

      const roles = data?.map(r => r.role) || [];
      setIsSuperAdmin(roles.includes('super_admin'));
      setIsAdmin(roles.includes('admin') || roles.includes('super_admin'));
      setIsEditor(roles.includes('editor') || roles.includes('admin') || roles.includes('super_admin'));
    } catch (err) {
      setMfaError(true);
      setMfaRequired(true);
      console.error('Error checking roles:', err);
      setIsAdmin(false);
      setIsEditor(false);
      setIsSuperAdmin(false);
    } finally {
      setRolesLoading(false);
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
          setRolesLoading(true);
          setTimeout(() => {
            checkRoles(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsEditor(false);
          setIsSuperAdmin(false);
          setMfaRequired(false);
          setMfaError(false);
          setRolesLoading(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkRoles(session.user.id).then(() => setLoading(false));
      } else {
        setRolesLoading(false);
        setLoading(false);
      }
    });

    const refreshVerification = () => {
      void supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) void checkRoles(data.session.user.id);
      });
    };
    window.addEventListener('mfa-verification-changed', refreshVerification);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('mfa-verification-changed', refreshVerification);
    };
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

  const refreshRoles = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await checkRoles(data.session.user.id);
  }, [checkRoles]);

  return {
    user,
    session,
    loading: loading || rolesLoading,
    isAdmin,
    isEditor,
    isSuperAdmin,
    mfaRequired,
    mfaError,
    refreshRoles,
    signIn,
    signUp,
    signOut,
  };
}

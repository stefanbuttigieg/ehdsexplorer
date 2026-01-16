import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIRole, ExplainLevel } from '@/data/aiRolePrompts';

const STORAGE_KEY_ROLE = 'ehds-ai-role';
const STORAGE_KEY_LEVEL = 'ehds-ai-level';
const STORAGE_KEY_SIMPLIFY = 'ehds-ai-simplify';

interface AIPreferences {
  role: AIRole;
  explainLevel: ExplainLevel;
  simplifyMode: boolean;
}

export const useAIPreferences = () => {
  const [preferences, setPreferences] = useState<AIPreferences>({
    role: 'general',
    explainLevel: 'professional',
    simplifyMode: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        if (user) {
          // Try to load from database for logged-in users
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_ai_role, preferred_explain_level')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            setPreferences({
              role: (profile.preferred_ai_role as AIRole) || 'general',
              explainLevel: (profile.preferred_explain_level as ExplainLevel) || 'professional',
              simplifyMode: profile.preferred_explain_level !== 'professional',
            });
          }
        } else {
          // Load from localStorage for guests
          const storedRole = localStorage.getItem(STORAGE_KEY_ROLE) as AIRole | null;
          const storedLevel = localStorage.getItem(STORAGE_KEY_LEVEL) as ExplainLevel | null;
          const storedSimplify = localStorage.getItem(STORAGE_KEY_SIMPLIFY);

          setPreferences({
            role: storedRole || 'general',
            explainLevel: storedLevel || 'professional',
            simplifyMode: storedSimplify === 'true',
          });
        }
      } catch (error) {
        console.error('Error loading AI preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Update role
  const setRole = useCallback(async (role: AIRole) => {
    setPreferences(prev => ({ ...prev, role }));

    if (userId) {
      // Save to database for logged-in users
      await supabase
        .from('profiles')
        .update({ preferred_ai_role: role })
        .eq('user_id', userId);
    } else {
      // Save to localStorage for guests
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    }
  }, [userId]);

  // Update explain level
  const setExplainLevel = useCallback(async (explainLevel: ExplainLevel) => {
    setPreferences(prev => ({ ...prev, explainLevel }));

    if (userId) {
      // Save to database for logged-in users
      await supabase
        .from('profiles')
        .update({ preferred_explain_level: explainLevel })
        .eq('user_id', userId);
    } else {
      // Save to localStorage for guests
      localStorage.setItem(STORAGE_KEY_LEVEL, explainLevel);
    }
  }, [userId]);

  // Update simplify mode
  const setSimplifyMode = useCallback((simplifyMode: boolean) => {
    setPreferences(prev => ({ ...prev, simplifyMode }));
    
    if (!userId) {
      localStorage.setItem(STORAGE_KEY_SIMPLIFY, String(simplifyMode));
    }
  }, [userId]);

  return {
    ...preferences,
    isLoading,
    isLoggedIn: !!userId,
    setRole,
    setExplainLevel,
    setSimplifyMode,
  };
};

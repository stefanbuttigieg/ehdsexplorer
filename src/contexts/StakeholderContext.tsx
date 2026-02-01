import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIRole } from '@/data/aiRolePrompts';

// Stakeholder types that map to AI roles (excluding 'general')
export type StakeholderType = 'citizen' | 'healthcare' | 'legal' | 'researcher' | 'developer' | 'policy';

export interface StakeholderConfig {
  id: StakeholderType;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
  aiRole: AIRole;
  color: string;
}

export const STAKEHOLDER_CONFIGS: StakeholderConfig[] = [
  {
    id: 'citizen',
    label: 'Citizen / Patient',
    shortLabel: 'Citizen',
    description: 'Focus on your rights and data access',
    icon: 'Heart',
    aiRole: 'citizen',
    color: 'text-pink-600 dark:text-pink-400',
  },
  {
    id: 'healthcare',
    label: 'Healthcare Professional',
    shortLabel: 'Healthcare',
    description: 'Clinical context and patient care',
    icon: 'Stethoscope',
    aiRole: 'healthcare',
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    id: 'legal',
    label: 'Legal / Compliance',
    shortLabel: 'Legal',
    description: 'Obligations, penalties, compliance',
    icon: 'Scale',
    aiRole: 'legal',
    color: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'researcher',
    label: 'Researcher',
    shortLabel: 'Researcher',
    description: 'Secondary use and data access',
    icon: 'FlaskConical',
    aiRole: 'researcher',
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    id: 'developer',
    label: 'Health Tech Developer',
    shortLabel: 'Developer',
    description: 'Technical requirements and APIs',
    icon: 'Code',
    aiRole: 'developer',
    color: 'text-green-600 dark:text-green-400',
  },
  {
    id: 'policy',
    label: 'Policy Maker',
    shortLabel: 'Policy',
    description: 'Governance and implementation',
    icon: 'Landmark',
    aiRole: 'policy',
    color: 'text-indigo-600 dark:text-indigo-400',
  },
];

const STORAGE_KEY = 'ehds-stakeholder-filter';

interface StakeholderContextValue {
  activeStakeholder: StakeholderType | null;
  setActiveStakeholder: (stakeholder: StakeholderType | null) => void;
  isFilterActive: boolean;
  clearFilter: () => void;
  getStakeholderConfig: (id: StakeholderType) => StakeholderConfig | undefined;
  isRelevantToStakeholder: (tags: string[] | null | undefined) => boolean;
  isLoading: boolean;
}

const StakeholderContext = createContext<StakeholderContextValue | undefined>(undefined);

export function StakeholderProvider({ children }: { children: ReactNode }) {
  const [activeStakeholder, setActiveStakeholderState] = useState<StakeholderType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUserId(user?.id || null);

        if (user) {
          // Load from profile for logged-in users
          const { data: profile } = await supabase
            .from('profiles')
            .select('stakeholder_filter')
            .eq('user_id', user.id)
            .single();

          if (profile?.stakeholder_filter) {
            setActiveStakeholderState(profile.stakeholder_filter as StakeholderType);
          }
        } else {
          // Load from localStorage for guests
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && STAKEHOLDER_CONFIGS.some(c => c.id === stored)) {
            setActiveStakeholderState(stored as StakeholderType);
          }
        }
      } catch (error) {
        console.error('Error loading stakeholder preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUserId(session.user.id);
        // Migrate localStorage preference to profile
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          await supabase
            .from('profiles')
            .update({ stakeholder_filter: stored })
            .eq('user_id', session.user.id);
          localStorage.removeItem(STORAGE_KEY);
        }
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setActiveStakeholder = useCallback(async (stakeholder: StakeholderType | null) => {
    setActiveStakeholderState(stakeholder);

    if (userId) {
      // Save to profile for logged-in users
      await supabase
        .from('profiles')
        .update({ stakeholder_filter: stakeholder })
        .eq('user_id', userId);
    } else {
      // Save to localStorage for guests
      if (stakeholder) {
        localStorage.setItem(STORAGE_KEY, stakeholder);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [userId]);

  const clearFilter = useCallback(() => {
    setActiveStakeholder(null);
  }, [setActiveStakeholder]);

  const getStakeholderConfig = useCallback((id: StakeholderType) => {
    return STAKEHOLDER_CONFIGS.find(c => c.id === id);
  }, []);

  const isRelevantToStakeholder = useCallback((tags: string[] | null | undefined) => {
    if (!activeStakeholder) return true; // No filter = show all
    if (!tags || tags.length === 0) return false; // No tags = not relevant when filtering
    return tags.includes(activeStakeholder);
  }, [activeStakeholder]);

  return (
    <StakeholderContext.Provider
      value={{
        activeStakeholder,
        setActiveStakeholder,
        isFilterActive: !!activeStakeholder,
        clearFilter,
        getStakeholderConfig,
        isRelevantToStakeholder,
        isLoading,
      }}
    >
      {children}
    </StakeholderContext.Provider>
  );
}

export function useStakeholder() {
  const context = useContext(StakeholderContext);
  if (!context) {
    throw new Error('useStakeholder must be used within a StakeholderProvider');
  }
  return context;
}

// Hook to get the AI role that matches the current stakeholder filter
export function useStakeholderAIRole() {
  const { activeStakeholder, getStakeholderConfig } = useStakeholder();
  
  if (!activeStakeholder) return null;
  
  const config = getStakeholderConfig(activeStakeholder);
  return config?.aiRole || null;
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { getUserLevel } from '@/data/achievements';

interface UserAchievement {
  id: string;
  achievement_id: string;
  unlocked_at: string;
  progress: number;
}

interface DbAchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tier: string;
  requirement_type: string;
  requirement_value: number;
  points: number;
  is_active: boolean;
}

interface RecentUnlock {
  definition: DbAchievementDefinition;
  points: number;
}

interface AchievementContextType {
  definitions: DbAchievementDefinition[];
  userAchievements: UserAchievement[];
  unlockAchievement: (achievementId: string) => void;
  checkAndUnlock: (type: string, value: number) => Promise<void>;
  updateProgress: (params: { achievementId: string; progress: number }) => void;
  totalPoints: number;
  currentLevel: ReturnType<typeof getUserLevel>;
  unlockedCount: number;
  totalCount: number;
  getByCategory: (category: string) => Array<DbAchievementDefinition & { isUnlocked: boolean; unlockedAt?: string; progress: number }>;
  recentUnlock: RecentUnlock | null;
  clearRecentUnlock: () => void;
  isLoggedIn: boolean;
}

const AchievementContext = createContext<AchievementContextType | null>(null);

const LOCAL_ACHIEVEMENTS_KEY = 'ehds_local_achievements';

const getLocalAchievements = (): UserAchievement[] => {
  try {
    const stored = localStorage.getItem(LOCAL_ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalAchievements = (achievements: UserAchievement[]) => {
  localStorage.setItem(LOCAL_ACHIEVEMENTS_KEY, JSON.stringify(achievements));
};

export const AchievementProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localAchievements, setLocalAchievementsState] = useState<UserAchievement[]>(getLocalAchievements);
  const [recentUnlock, setRecentUnlock] = useState<RecentUnlock | null>(null);

  // Fetch achievement definitions
  const { data: definitions = [] } = useQuery({
    queryKey: ['achievement-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievement_definitions')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('requirement_value');
      
      if (error) throw error;
      return data as DbAchievementDefinition[];
    },
  });

  // Fetch user's unlocked achievements (from DB for logged-in users)
  const { data: dbAchievements = [] } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });

  const userAchievements = user ? dbAchievements : localAchievements;

  // Unlock achievement mutation
  const unlockMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const definition = definitions.find(d => d.id === achievementId);
      if (!definition) throw new Error('Achievement not found');
      
      // Check if already unlocked
      const alreadyUnlocked = userAchievements.some(a => a.achievement_id === achievementId);
      if (alreadyUnlocked) return null;

      if (user) {
        const { data, error } = await supabase
          .from('user_achievements')
          .insert({
            user_id: user.id,
            achievement_id: achievementId,
            progress: definition.requirement_value,
          })
          .select()
          .single();
        
        if (error) {
          if (error.code === '23505') return null; // Already exists
          throw error;
        }
        return { achievement: data, definition };
      } else {
        const newAchievement: UserAchievement = {
          id: crypto.randomUUID(),
          achievement_id: achievementId,
          unlocked_at: new Date().toISOString(),
          progress: definition.requirement_value,
        };
        const updated = [...localAchievements, newAchievement];
        setLocalAchievements(updated);
        setLocalAchievementsState(updated);
        return { achievement: newAchievement, definition };
      }
    },
    onSuccess: (result) => {
      if (result) {
        console.log('Achievement unlocked, setting recentUnlock:', result.definition.name);
        setRecentUnlock({ definition: result.definition, points: result.definition.points });
        if (user) {
          queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        }
      }
    },
  });

  // Check and unlock achievement based on type and value
  const checkAndUnlock = useCallback(async (type: string, value: number) => {
    console.log('checkAndUnlock called:', type, value, 'definitions:', definitions.length);
    const eligibleAchievements = definitions.filter(
      d => d.requirement_type === type && value >= d.requirement_value
    );

    console.log('Eligible achievements:', eligibleAchievements.map(a => a.name));

    for (const achievement of eligibleAchievements) {
      const alreadyUnlocked = userAchievements.some(a => a.achievement_id === achievement.id);
      if (!alreadyUnlocked) {
        console.log('Unlocking achievement:', achievement.name);
        await unlockMutation.mutateAsync(achievement.id);
      }
    }
  }, [definitions, userAchievements, unlockMutation]);

  // Update progress for an achievement
  const updateProgress = useMutation({
    mutationFn: async ({ achievementId, progress }: { achievementId: string; progress: number }) => {
      if (user) {
        const { error } = await supabase
          .from('user_achievements')
          .upsert({
            user_id: user.id,
            achievement_id: achievementId,
            progress,
          });
        if (error) throw error;
      } else {
        const existing = localAchievements.find(a => a.achievement_id === achievementId);
        if (existing) {
          const updated = localAchievements.map(a =>
            a.achievement_id === achievementId ? { ...a, progress } : a
          );
          setLocalAchievements(updated);
          setLocalAchievementsState(updated);
        }
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      }
    },
  });

  // Calculate total points
  const totalPoints = userAchievements.reduce((sum, ua) => {
    const def = definitions.find(d => d.id === ua.achievement_id);
    return sum + (def?.points || 0);
  }, 0);

  const currentLevel = getUserLevel(totalPoints);
  const unlockedCount = userAchievements.length;
  const totalCount = definitions.length;

  // Get achievements by category
  const getByCategory = useCallback((category: string) => {
    return definitions.filter(d => d.category === category).map(def => ({
      ...def,
      isUnlocked: userAchievements.some(ua => ua.achievement_id === def.id),
      unlockedAt: userAchievements.find(ua => ua.achievement_id === def.id)?.unlocked_at,
      progress: userAchievements.find(ua => ua.achievement_id === def.id)?.progress || 0,
    }));
  }, [definitions, userAchievements]);

  // Clear recent unlock notification
  const clearRecentUnlock = useCallback(() => {
    setRecentUnlock(null);
  }, []);

  return (
    <AchievementContext.Provider
      value={{
        definitions,
        userAchievements,
        unlockAchievement: unlockMutation.mutate,
        checkAndUnlock,
        updateProgress: updateProgress.mutate,
        totalPoints,
        currentLevel,
        unlockedCount,
        totalCount,
        getByCategory,
        recentUnlock,
        clearRecentUnlock,
        isLoggedIn: !!user,
      }}
    >
      {children}
    </AchievementContext.Provider>
  );
};

export const useAchievementContext = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievementContext must be used within an AchievementProvider');
  }
  return context;
};

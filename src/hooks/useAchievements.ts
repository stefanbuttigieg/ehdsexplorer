import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { AchievementDefinition, getUserLevel, LEVEL_THRESHOLDS } from '@/data/achievements';

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

export const useAchievements = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localAchievements, setLocalAchievementsState] = useState<UserAchievement[]>(getLocalAchievements);
  const [recentUnlock, setRecentUnlock] = useState<{ definition: DbAchievementDefinition; points: number } | null>(null);

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
        setRecentUnlock({ definition: result.definition, points: result.definition.points });
        if (user) {
          queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
        }
      }
    },
  });

  // Check and unlock achievement based on type and value
  const checkAndUnlock = useCallback(async (type: string, value: number) => {
    const eligibleAchievements = definitions.filter(
      d => d.requirement_type === type && value >= d.requirement_value
    );

    for (const achievement of eligibleAchievements) {
      const alreadyUnlocked = userAchievements.some(a => a.achievement_id === achievement.id);
      if (!alreadyUnlocked) {
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

  return {
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
  };
};

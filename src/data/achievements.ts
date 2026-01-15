export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export type AchievementCategory = 'reading' | 'chapters' | 'definitions' | 'games' | 'engagement' | 'streaks' | 'exploration';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  tier: AchievementTier;
  requirementType: string;
  requirementValue: number;
  points: number;
}

export const TIER_COLORS: Record<AchievementTier, { bg: string; border: string; text: string; glow: string }> = {
  bronze: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    border: 'border-amber-600 dark:border-amber-500',
    text: 'text-amber-700 dark:text-amber-400',
    glow: 'shadow-amber-500/30',
  },
  silver: {
    bg: 'bg-slate-100 dark:bg-slate-800/50',
    border: 'border-slate-400 dark:border-slate-500',
    text: 'text-slate-600 dark:text-slate-300',
    glow: 'shadow-slate-400/30',
  },
  gold: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    border: 'border-yellow-500 dark:border-yellow-400',
    text: 'text-yellow-700 dark:text-yellow-400',
    glow: 'shadow-yellow-500/40',
  },
  platinum: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    border: 'border-indigo-500 dark:border-indigo-400',
    text: 'text-indigo-700 dark:text-indigo-400',
    glow: 'shadow-indigo-500/50',
  },
};

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  reading: 'Reading Progress',
  chapters: 'Chapter Mastery',
  definitions: 'Definition Mastery',
  games: 'Learning Games',
  engagement: 'Engagement',
  streaks: 'Streaks',
  exploration: 'Exploration',
};

export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Newcomer', minPoints: 0, maxPoints: 100 },
  { level: 2, name: 'Explorer', minPoints: 101, maxPoints: 300 },
  { level: 3, name: 'Scholar', minPoints: 301, maxPoints: 600 },
  { level: 4, name: 'Expert', minPoints: 601, maxPoints: 1000 },
  { level: 5, name: 'EHDS Master', minPoints: 1001, maxPoints: Infinity },
];

export const getUserLevel = (points: number) => {
  return LEVEL_THRESHOLDS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVEL_THRESHOLDS[0];
};

export const getProgressToNextLevel = (points: number) => {
  const currentLevel = getUserLevel(points);
  if (currentLevel.maxPoints === Infinity) return 100;
  
  const pointsInLevel = points - currentLevel.minPoints;
  const pointsNeeded = currentLevel.maxPoints - currentLevel.minPoints;
  return Math.round((pointsInLevel / pointsNeeded) * 100);
};

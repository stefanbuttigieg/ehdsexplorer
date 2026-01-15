import { useAchievements } from '@/hooks/useAchievements';
import { Progress } from '@/components/ui/progress';
import { getProgressToNextLevel } from '@/data/achievements';
import { Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AchievementProgressProps {
  compact?: boolean;
}

export const AchievementProgress = ({ compact = false }: AchievementProgressProps) => {
  const { totalPoints, currentLevel, unlockedCount, totalCount } = useAchievements();
  const progressToNext = getProgressToNextLevel(totalPoints);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium">{totalPoints} pts</span>
        <span className="text-xs text-muted-foreground">
          Lvl {currentLevel.level}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-lg">{totalPoints} points</p>
            <p className="text-sm text-muted-foreground">
              Level {currentLevel.level} - {currentLevel.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold">{unlockedCount}/{totalCount}</p>
          <p className="text-xs text-muted-foreground">Achievements</p>
        </div>
      </div>

      {currentLevel.maxPoints !== Infinity && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress to Level {currentLevel.level + 1}</span>
            <span>{progressToNext}%</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
        </div>
      )}
    </div>
  );
};

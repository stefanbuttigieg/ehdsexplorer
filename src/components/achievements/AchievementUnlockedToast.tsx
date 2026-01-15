import { useEffect } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { TIER_COLORS, AchievementTier } from '@/data/achievements';
import { AchievementBadge } from './AchievementBadge';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AchievementUnlockedToast = () => {
  const { recentUnlock, clearRecentUnlock } = useAchievements();

  useEffect(() => {
    if (recentUnlock) {
      const timer = setTimeout(() => {
        clearRecentUnlock();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentUnlock, clearRecentUnlock]);

  if (!recentUnlock) return null;

  const { definition, points } = recentUnlock;
  const tierColors = TIER_COLORS[definition.tier as AchievementTier];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className={cn(
          'fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto',
          'rounded-lg border-2 p-4 shadow-2xl backdrop-blur-sm',
          'min-w-[300px] max-w-[400px]',
          tierColors.border,
          tierColors.bg
        )}
      >
        <button
          onClick={clearRecentUnlock}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
          >
            <AchievementBadge
              name={definition.name}
              description={definition.description}
              icon={definition.icon}
              tier={definition.tier as AchievementTier}
              isUnlocked={true}
              size="lg"
              showTooltip={false}
            />
          </motion.div>

          <div className="flex-1">
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              🎉 Achievement Unlocked!
            </motion.p>
            <motion.h3
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={cn('font-bold text-lg', tierColors.text)}
            >
              {definition.name}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground"
            >
              {definition.description}
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={cn('text-sm font-bold mt-1', tierColors.text)}
            >
              +{points} points
            </motion.p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

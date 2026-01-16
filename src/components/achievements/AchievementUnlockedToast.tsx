import { useEffect, useState } from 'react';
import { useAchievements } from '@/hooks/useAchievements';
import { TIER_COLORS, AchievementTier } from '@/data/achievements';
import { AchievementBadge } from './AchievementBadge';
import { cn } from '@/lib/utils';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

// Confetti particles for celebration effect
const ConfettiParticle = ({ delay, color }: { delay: number; color: string }) => (
  <motion.div
    initial={{ opacity: 1, y: 0, x: 0, scale: 1, rotate: 0 }}
    animate={{
      opacity: [1, 1, 0],
      y: [-20, -80],
      x: [0, (Math.random() - 0.5) * 100],
      scale: [1, 0.5],
      rotate: [0, Math.random() * 360],
    }}
    transition={{ duration: 1.5, delay, ease: 'easeOut' }}
    className={cn('absolute w-2 h-2 rounded-sm', color)}
    style={{ left: `${Math.random() * 100}%`, top: '50%' }}
  />
);

const CONFETTI_COLORS = [
  'bg-yellow-400',
  'bg-pink-400',
  'bg-blue-400',
  'bg-green-400',
  'bg-purple-400',
  'bg-orange-400',
];

export const AchievementUnlockedToast = () => {
  const { recentUnlock, clearRecentUnlock, isLoggedIn } = useAchievements();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (recentUnlock) {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        clearRecentUnlock();
        setShowConfetti(false);
      }, 6000);
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
          'min-w-[320px] max-w-[420px]',
          tierColors.border,
          tierColors.bg
        )}
      >
        {/* Confetti effect */}
        {showConfetti && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <ConfettiParticle
                key={i}
                delay={i * 0.05}
                color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => {
            clearRecentUnlock();
            setShowConfetti(false);
          }}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/20 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', bounce: 0.6, delay: 0.1 }}
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

          <div className="flex-1 min-w-0">
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
              className={cn('font-bold text-lg truncate', tierColors.text)}
            >
              {definition.name}
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm text-muted-foreground line-clamp-2"
            >
              {definition.description}
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 mt-2"
            >
              <span className={cn('text-sm font-bold', tierColors.text)}>
                +{points} points
              </span>
              {isLoggedIn && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  <Link
                    to="/profile?tab=achievements"
                    onClick={() => {
                      clearRecentUnlock();
                      setShowConfetti(false);
                    }}
                  >
                    View All <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

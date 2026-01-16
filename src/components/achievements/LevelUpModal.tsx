import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/hooks/useAchievements';
import { LEVEL_THRESHOLDS, getProgressToNextLevel } from '@/data/achievements';
import { Link } from 'react-router-dom';

const LEVEL_COLORS = {
  1: 'from-slate-400 to-slate-600',
  2: 'from-emerald-400 to-emerald-600',
  3: 'from-blue-400 to-blue-600',
  4: 'from-purple-400 to-purple-600',
  5: 'from-amber-400 to-amber-600',
};

export const LevelUpModal = () => {
  const { currentLevel, totalPoints, isLoggedIn } = useAchievements();
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    
    const storedLevel = localStorage.getItem('ehds-user-level');
    const storedLevelNum = storedLevel ? parseInt(storedLevel, 10) : null;
    
    if (storedLevelNum !== null && currentLevel.level > storedLevelNum) {
      setPreviousLevel(storedLevelNum);
      setShowModal(true);
    }
    
    localStorage.setItem('ehds-user-level', currentLevel.level.toString());
  }, [currentLevel.level, isLoggedIn]);

  const handleClose = () => {
    setShowModal(false);
    setPreviousLevel(null);
  };

  if (!showModal || previousLevel === null) return null;

  const levelColor = LEVEL_COLORS[currentLevel.level as keyof typeof LEVEL_COLORS] || LEVEL_COLORS[1];

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className={cn('absolute inset-0 bg-gradient-to-br', levelColor)}
          />
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-center text-2xl font-bold">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 blur-xl opacity-50"
                >
                  <div className={cn('w-24 h-24 rounded-full bg-gradient-to-br', levelColor)} />
                </motion.div>
                <div className={cn(
                  'relative w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center',
                  levelColor
                )}>
                  <Trophy className="w-12 h-12 text-white" />
                </div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
              </div>
              
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                🎉 Level Up!
              </motion.span>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative z-10 text-center space-y-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-muted-foreground">
              You've reached
            </p>
            <p className={cn(
              'text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent',
              levelColor
            )}>
              Level {currentLevel.level}: {currentLevel.name}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-lg"
          >
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{totalPoints} points</span>
          </motion.div>

          {currentLevel.level < 5 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground"
            >
              {LEVEL_THRESHOLDS[currentLevel.level]?.minPoints - totalPoints} more points to reach{' '}
              <span className="font-medium">{LEVEL_THRESHOLDS[currentLevel.level]?.name}</span>
            </motion.p>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="pt-4 flex gap-2 justify-center"
          >
            <Button variant="outline" onClick={handleClose}>
              Continue
            </Button>
            <Button asChild>
              <Link to="/profile?tab=achievements" onClick={handleClose}>
                View Achievements
              </Link>
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

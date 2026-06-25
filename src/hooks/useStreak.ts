import { useState, useEffect, useCallback } from "react";
import { useAchievements } from "./useAchievements";

const STORAGE_KEY = "ehds-visit-streak";

interface StreakData {
  current: number;
  longest: number;
  lastVisit: string | null; // YYYY-MM-DD
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const dayDiff = (a: string, b: string) => {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
};

/**
 * Tracks a daily-visit streak in localStorage. On first call each day it
 * increments the streak (or resets it if a day was missed) and reports the
 * streak length to the achievements system.
 */
export const useStreak = () => {
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastVisit: null });
  const { checkAndUnlock } = useAchievements();

  useEffect(() => {
    let data: StreakData = { current: 0, longest: 0, lastVisit: null };
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        data = JSON.parse(stored);
      } catch {
        /* ignore */
      }
    }

    const today = todayStr();
    if (data.lastVisit === today) {
      setStreak(data);
      return;
    }

    const diff = data.lastVisit ? dayDiff(data.lastVisit, today) : null;
    let current = 1;
    if (diff === 1) current = data.current + 1;
    const longest = Math.max(data.longest || 0, current);
    const updated: StreakData = { current, longest, lastVisit: today };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setStreak(updated);

    // Report to achievements (streak-based achievements use 'streak_days')
    checkAndUnlock("streak_days", current);
  }, [checkAndUnlock]);

  const reset = useCallback(() => {
    const cleared = { current: 0, longest: 0, lastVisit: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleared));
    setStreak(cleared);
  }, []);

  return { ...streak, reset };
};
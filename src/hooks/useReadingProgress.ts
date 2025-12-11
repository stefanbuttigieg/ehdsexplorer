import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "ehds-reading-progress";

interface ReadingProgress {
  readArticles: number[];
  lastRead: number | null;
}

export const useReadingProgress = () => {
  const [progress, setProgress] = useState<ReadingProgress>({
    readArticles: [],
    lastRead: null,
  });

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch {
        // Invalid JSON, reset
      }
    }
  }, []);

  const saveProgress = useCallback((newProgress: ReadingProgress) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  }, []);

  const markAsRead = useCallback((articleId: number) => {
    setProgress((prev) => {
      if (prev.readArticles.includes(articleId)) {
        return { ...prev, lastRead: articleId };
      }
      const newProgress = {
        readArticles: [...prev.readArticles, articleId],
        lastRead: articleId,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
      return newProgress;
    });
  }, []);

  const isRead = useCallback((articleId: number) => {
    return progress.readArticles.includes(articleId);
  }, [progress.readArticles]);

  const getChapterProgress = useCallback((articleRange: [number, number]) => {
    const [start, end] = articleRange;
    const totalArticles = end - start + 1;
    const readCount = progress.readArticles.filter(
      (id) => id >= start && id <= end
    ).length;
    return {
      read: readCount,
      total: totalArticles,
      percentage: Math.round((readCount / totalArticles) * 100),
    };
  }, [progress.readArticles]);

  const clearProgress = useCallback(() => {
    const newProgress = { readArticles: [], lastRead: null };
    saveProgress(newProgress);
  }, [saveProgress]);

  return {
    readArticles: progress.readArticles,
    lastRead: progress.lastRead,
    markAsRead,
    isRead,
    getChapterProgress,
    clearProgress,
  };
};

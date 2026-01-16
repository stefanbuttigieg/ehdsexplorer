import { useState, useEffect, useCallback } from "react";
import { useAchievements } from "./useAchievements";

type BookmarkType = 'article' | 'recital' | 'act' | 'annex';

interface Bookmark {
  type: BookmarkType;
  id: number | string;
  addedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { checkAndUnlock } = useAchievements();

  useEffect(() => {
    const stored = localStorage.getItem('ehds-bookmarks');
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, []);

  const saveBookmarks = useCallback((newBookmarks: Bookmark[]) => {
    localStorage.setItem('ehds-bookmarks', JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  }, []);

  const isBookmarked = useCallback((type: BookmarkType, id: number | string) => {
    return bookmarks.some(b => b.type === type && b.id === id);
  }, [bookmarks]);

  const toggleBookmark = useCallback((type: BookmarkType, id: number | string) => {
    if (isBookmarked(type, id)) {
      saveBookmarks(bookmarks.filter(b => !(b.type === type && b.id === id)));
    } else {
      const newBookmarks = [...bookmarks, { type, id, addedAt: new Date().toISOString() }];
      saveBookmarks(newBookmarks);
      
      // Check for bookmark achievements
      checkAndUnlock('bookmarks', newBookmarks.length);
    }
  }, [bookmarks, isBookmarked, saveBookmarks, checkAndUnlock]);

  const getBookmarksByType = useCallback((type: BookmarkType) => {
    return bookmarks.filter(b => b.type === type);
  }, [bookmarks]);

  return { bookmarks, isBookmarked, toggleBookmark, getBookmarksByType };
}

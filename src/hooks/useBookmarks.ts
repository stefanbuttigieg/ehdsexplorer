import { useState, useEffect, useCallback } from "react";

type BookmarkType = 'article' | 'recital' | 'act' | 'annex';

interface Bookmark {
  type: BookmarkType;
  id: number | string;
  addedAt: string;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

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
      saveBookmarks([...bookmarks, { type, id, addedAt: new Date().toISOString() }]);
    }
  }, [bookmarks, isBookmarked, saveBookmarks]);

  const getBookmarksByType = useCallback((type: BookmarkType) => {
    return bookmarks.filter(b => b.type === type);
  }, [bookmarks]);

  return { bookmarks, isBookmarked, toggleBookmark, getBookmarksByType };
}

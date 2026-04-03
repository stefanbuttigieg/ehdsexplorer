import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type StudyContentType = 'faq' | 'article' | 'recital';
export type StudyStatus = 'unread' | 'read' | 'reviewing' | 'mastered';

export interface StudyProgressEntry {
  content_type: StudyContentType;
  content_id: string;
  status: StudyStatus;
  review_count: number;
  last_studied_at: string;
}

const LOCAL_KEY = 'ehds-study-progress';

function getLocalProgress(): StudyProgressEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
  } catch { return []; }
}

function setLocalProgress(entries: StudyProgressEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries));
}

function findLocal(type: StudyContentType, id: string): StudyProgressEntry | undefined {
  return getLocalProgress().find(e => e.content_type === type && e.content_id === id);
}

function upsertLocal(entry: StudyProgressEntry) {
  const all = getLocalProgress().filter(
    e => !(e.content_type === entry.content_type && e.content_id === entry.content_id)
  );
  all.push(entry);
  setLocalProgress(all);
}

export function useStudyProgress() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: dbProgress = [], isLoading } = useQuery({
    queryKey: ['study-progress', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_progress')
        .select('content_type, content_id, status, review_count, last_studied_at')
        .eq('user_id', user!.id);
      if (error) throw error;
      return (data || []) as StudyProgressEntry[];
    },
  });

  // Sync local → DB on login
  useEffect(() => {
    if (!user) return;
    const local = getLocalProgress();
    if (local.length === 0) return;

    const syncLocal = async () => {
      for (const entry of local) {
        await supabase.from('study_progress').upsert({
          user_id: user.id,
          content_type: entry.content_type,
          content_id: entry.content_id,
          status: entry.status,
          review_count: entry.review_count,
          last_studied_at: entry.last_studied_at,
        }, { onConflict: 'user_id,content_type,content_id' });
      }
      localStorage.removeItem(LOCAL_KEY);
      queryClient.invalidateQueries({ queryKey: ['study-progress', user.id] });
    };
    syncLocal();
  }, [user, queryClient]);

  const allProgress = user ? dbProgress : getLocalProgress();

  const getStatus = useCallback((type: StudyContentType, id: string): StudyStatus => {
    if (user) {
      const found = dbProgress.find(e => e.content_type === type && e.content_id === id);
      return found?.status || 'unread';
    }
    return findLocal(type, id)?.status || 'unread';
  }, [user, dbProgress]);

  const updateProgress = useCallback(async (
    type: StudyContentType, id: string, status: StudyStatus
  ) => {
    const now = new Date().toISOString();
    const existing = user
      ? dbProgress.find(e => e.content_type === type && e.content_id === id)
      : findLocal(type, id);
    const reviewCount = (existing?.review_count || 0) + (status === 'reviewing' || status === 'mastered' ? 1 : 0);

    if (user) {
      await supabase.from('study_progress').upsert({
        user_id: user.id,
        content_type: type,
        content_id: id,
        status,
        review_count: reviewCount,
        last_studied_at: now,
      }, { onConflict: 'user_id,content_type,content_id' });
      queryClient.invalidateQueries({ queryKey: ['study-progress', user.id] });
    } else {
      upsertLocal({ content_type: type, content_id: id, status, review_count: reviewCount, last_studied_at: now });
    }
  }, [user, dbProgress, queryClient]);

  const getProgressStats = useCallback((type?: StudyContentType) => {
    const filtered = type ? allProgress.filter(e => e.content_type === type) : allProgress;
    const read = filtered.filter(e => e.status === 'read').length;
    const reviewing = filtered.filter(e => e.status === 'reviewing').length;
    const mastered = filtered.filter(e => e.status === 'mastered').length;
    return { total: filtered.length, read, reviewing, mastered, completed: read + mastered };
  }, [allProgress]);

  const getReviewItems = useCallback((type?: StudyContentType) => {
    const filtered = type ? allProgress.filter(e => e.content_type === type) : allProgress;
    return filtered.filter(e => e.status === 'reviewing')
      .sort((a, b) => new Date(a.last_studied_at).getTime() - new Date(b.last_studied_at).getTime());
  }, [allProgress]);

  return {
    allProgress,
    isLoading,
    getStatus,
    updateProgress,
    getProgressStats,
    getReviewItems,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAchievements } from './useAchievements';
import { useState } from 'react';

export interface UserNote {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  related_content: RelatedContent[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface RelatedContent {
  type: 'article' | 'recital' | 'implementing_act';
  id: string;
  title: string;
}

interface CreateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  related_content?: RelatedContent[];
}

interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  related_content?: RelatedContent[];
  is_pinned?: boolean;
}

const LOCAL_NOTES_KEY = 'ehds_local_notes';

const getLocalNotes = (): UserNote[] => {
  try {
    const stored = localStorage.getItem(LOCAL_NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalNotes = (notes: UserNote[]) => {
  localStorage.setItem(LOCAL_NOTES_KEY, JSON.stringify(notes));
};

export const useUserNotes = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { checkAndUnlock } = useAchievements();
  const [localNotes, setLocalNotesState] = useState<UserNote[]>(getLocalNotes);

  const { data: dbNotes = [], isLoading } = useQuery({
    queryKey: ['user-notes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(note => ({
        ...note,
        related_content: (note.related_content as unknown as RelatedContent[]) || [],
      })) as UserNote[];
    },
    enabled: !!user,
  });

  const notes = user ? dbNotes : localNotes.sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const createNote = useMutation({
    mutationFn: async (input: CreateNoteInput = {}) => {
      if (user) {
        const insertData = {
          user_id: user.id,
          title: input.title || 'Untitled Note',
          content: input.content || '',
          tags: input.tags || [],
          related_content: JSON.parse(JSON.stringify(input.related_content || [])),
        };
        
        const { data, error } = await supabase
          .from('user_notes')
          .insert([insertData])
          .select()
          .single();
        
        if (error) throw error;
        return {
          ...data,
          related_content: (data.related_content as unknown as RelatedContent[]) || [],
        } as UserNote;
      } else {
        const newNote: UserNote = {
          id: crypto.randomUUID(),
          user_id: 'local',
          title: input.title || 'Untitled Note',
          content: input.content || '',
          tags: input.tags || [],
          related_content: input.related_content || [],
          is_pinned: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [...localNotes, newNote];
        setLocalNotes(updated);
        setLocalNotesState(updated);
        return newNote;
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user-notes'] });
      }
      // Check for notes achievements
      const noteCount = user ? dbNotes.length + 1 : localNotes.length + 1;
      checkAndUnlock('notes', noteCount);
    },
  });

  const updateNote = useMutation({
    mutationFn: async (input: UpdateNoteInput) => {
      if (user) {
        const updateData: Record<string, unknown> = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.content !== undefined) updateData.content = input.content;
        if (input.tags !== undefined) updateData.tags = input.tags;
        if (input.related_content !== undefined) updateData.related_content = input.related_content;
        if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;

        const { data, error } = await supabase
          .from('user_notes')
          .update(updateData)
          .eq('id', input.id)
          .select()
          .single();
        
        if (error) throw error;
        return {
          ...data,
          related_content: (data.related_content as unknown as RelatedContent[]) || [],
        } as UserNote;
      } else {
        const updated = localNotes.map(n => 
          n.id === input.id 
            ? {
                ...n, 
                ...input, 
                updated_at: new Date().toISOString() 
              }
            : n
        );
        setLocalNotes(updated);
        setLocalNotesState(updated);
        return updated.find(n => n.id === input.id);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user-notes'] });
      }
    },
  });

  const deleteNote = useMutation({
    mutationFn: async (id: string) => {
      if (user) {
        const { error } = await supabase
          .from('user_notes')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const updated = localNotes.filter(n => n.id !== id);
        setLocalNotes(updated);
        setLocalNotesState(updated);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['user-notes'] });
      }
    },
  });

  return {
    notes,
    isLoading: user ? isLoading : false,
    createNote,
    updateNote,
    deleteNote,
    isLoggedIn: !!user,
  };
};

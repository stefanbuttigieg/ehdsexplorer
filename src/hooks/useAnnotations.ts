import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

export interface Annotation {
  id: string;
  user_id: string;
  content_type: 'article' | 'recital' | 'implementing_act';
  content_id: string;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  highlight_color: string;
  comment: string | null;
  created_at: string;
  updated_at: string;
  tags?: AnnotationTag[];
}

export interface AnnotationTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

interface CreateAnnotationInput {
  content_type: 'article' | 'recital' | 'implementing_act';
  content_id: string;
  selected_text: string;
  start_offset: number;
  end_offset: number;
  highlight_color?: string;
  comment?: string;
  tag_ids?: string[];
}

interface UpdateAnnotationInput {
  id: string;
  highlight_color?: string;
  comment?: string;
  tag_ids?: string[];
}

// Local storage key for annotations when not logged in
const LOCAL_ANNOTATIONS_KEY = 'ehds_local_annotations';
const LOCAL_TAGS_KEY = 'ehds_local_tags';

const getLocalAnnotations = (): Annotation[] => {
  try {
    const stored = localStorage.getItem(LOCAL_ANNOTATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalAnnotations = (annotations: Annotation[]) => {
  localStorage.setItem(LOCAL_ANNOTATIONS_KEY, JSON.stringify(annotations));
};

const getLocalTags = (): AnnotationTag[] => {
  try {
    const stored = localStorage.getItem(LOCAL_TAGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const setLocalTags = (tags: AnnotationTag[]) => {
  localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(tags));
};

export const useAnnotations = (contentType?: string, contentId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localAnnotations, setLocalAnnotationsState] = useState<Annotation[]>(getLocalAnnotations);

  // Fetch annotations from database if logged in
  const { data: dbAnnotations = [], isLoading } = useQuery({
    queryKey: ['annotations', user?.id, contentType, contentId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('annotations')
        .select('*')
        .eq('user_id', user.id);
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      if (contentId) {
        query = query.eq('content_id', contentId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as Annotation[];
    },
    enabled: !!user,
  });

  // Filter local annotations if content type/id specified
  const filteredLocalAnnotations = contentType || contentId
    ? localAnnotations.filter(a => 
        (!contentType || a.content_type === contentType) &&
        (!contentId || a.content_id === contentId)
      )
    : localAnnotations;

  const annotations = user ? dbAnnotations : filteredLocalAnnotations;

  // Create annotation
  const createAnnotation = useMutation({
    mutationFn: async (input: CreateAnnotationInput) => {
      if (user) {
        const { data, error } = await supabase
          .from('annotations')
          .insert({
            user_id: user.id,
            content_type: input.content_type,
            content_id: input.content_id,
            selected_text: input.selected_text,
            start_offset: input.start_offset,
            end_offset: input.end_offset,
            highlight_color: input.highlight_color || 'yellow',
            comment: input.comment || null,
          })
          .select()
          .single();
        
        if (error) throw error;

        // Link tags if provided
        if (input.tag_ids?.length) {
          await supabase
            .from('annotation_tag_links')
            .insert(input.tag_ids.map(tag_id => ({
              annotation_id: data.id,
              tag_id,
            })));
        }

        return data;
      } else {
        // Store locally
        const newAnnotation: Annotation = {
          id: crypto.randomUUID(),
          user_id: 'local',
          content_type: input.content_type,
          content_id: input.content_id,
          selected_text: input.selected_text,
          start_offset: input.start_offset,
          end_offset: input.end_offset,
          highlight_color: input.highlight_color || 'yellow',
          comment: input.comment || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const updated = [...localAnnotations, newAnnotation];
        setLocalAnnotations(updated);
        setLocalAnnotationsState(updated);
        return newAnnotation;
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['annotations'] });
      }
    },
  });

  // Update annotation
  const updateAnnotation = useMutation({
    mutationFn: async (input: UpdateAnnotationInput) => {
      if (user) {
        const { data, error } = await supabase
          .from('annotations')
          .update({
            highlight_color: input.highlight_color,
            comment: input.comment,
          })
          .eq('id', input.id)
          .select()
          .single();
        
        if (error) throw error;

        // Update tag links if provided
        if (input.tag_ids !== undefined) {
          await supabase
            .from('annotation_tag_links')
            .delete()
            .eq('annotation_id', input.id);
          
          if (input.tag_ids.length) {
            await supabase
              .from('annotation_tag_links')
              .insert(input.tag_ids.map(tag_id => ({
                annotation_id: input.id,
                tag_id,
              })));
          }
        }

        return data;
      } else {
        const updated = localAnnotations.map(a => 
          a.id === input.id 
            ? { ...a, ...input, updated_at: new Date().toISOString() }
            : a
        );
        setLocalAnnotations(updated);
        setLocalAnnotationsState(updated);
        return updated.find(a => a.id === input.id);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['annotations'] });
      }
    },
  });

  // Delete annotation
  const deleteAnnotation = useMutation({
    mutationFn: async (id: string) => {
      if (user) {
        const { error } = await supabase
          .from('annotations')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const updated = localAnnotations.filter(a => a.id !== id);
        setLocalAnnotations(updated);
        setLocalAnnotationsState(updated);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['annotations'] });
      }
    },
  });

  return {
    annotations,
    isLoading: user ? isLoading : false,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
    isLoggedIn: !!user,
  };
};

export const useAnnotationTags = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localTags, setLocalTagsState] = useState<AnnotationTag[]>(getLocalTags);

  const { data: dbTags = [], isLoading } = useQuery({
    queryKey: ['annotation-tags', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('annotation_tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      return data as AnnotationTag[];
    },
    enabled: !!user,
  });

  const tags = user ? dbTags : localTags;

  const createTag = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (user) {
        const { data, error } = await supabase
          .from('annotation_tags')
          .insert({ user_id: user.id, name, color })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        const newTag: AnnotationTag = {
          id: crypto.randomUUID(),
          user_id: 'local',
          name,
          color,
          created_at: new Date().toISOString(),
        };
        const updated = [...localTags, newTag];
        setLocalTags(updated);
        setLocalTagsState(updated);
        return newTag;
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['annotation-tags'] });
      }
    },
  });

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      if (user) {
        const { error } = await supabase
          .from('annotation_tags')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      } else {
        const updated = localTags.filter(t => t.id !== id);
        setLocalTags(updated);
        setLocalTagsState(updated);
      }
    },
    onSuccess: () => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['annotation-tags'] });
      }
    },
  });

  return {
    tags,
    isLoading: user ? isLoading : false,
    createTag,
    deleteTag,
  };
};

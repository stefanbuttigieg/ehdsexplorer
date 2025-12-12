import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Section {
  id: number;
  chapter_id: number;
  section_number: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useSections() {
  return useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('chapter_id', { ascending: true })
        .order('section_number', { ascending: true });

      if (error) throw error;
      return data as Section[];
    },
  });
}

export function useSectionsByChapter(chapterId: number | null) {
  return useQuery({
    queryKey: ['sections', 'by-chapter', chapterId],
    queryFn: async () => {
      if (!chapterId) return [];
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('chapter_id', chapterId)
        .order('section_number', { ascending: true });

      if (error) throw error;
      return data as Section[];
    },
    enabled: !!chapterId,
  });
}

export function useCreateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (section: Omit<Section, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('sections')
        .insert(section)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

export function useUpdateSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Section> & { id: number }) => {
      const { data, error } = await supabase
        .from('sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
}

export function useDeleteSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface HelpCenterFaq {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type HelpCenterFaqInsert = Omit<HelpCenterFaq, 'id' | 'created_at' | 'updated_at'>;
export type HelpCenterFaqUpdate = Partial<HelpCenterFaqInsert>;

const FAQ_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'ehds', label: 'EHDS Regulation' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'features', label: 'Features' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'technical', label: 'Technical' },
] as const;

export const useFaqCategories = () => FAQ_CATEGORIES;

export const useHelpCenterFaqs = (publishedOnly = false) => {
  return useQuery({
    queryKey: ['help-center-faqs', publishedOnly],
    queryFn: async () => {
      let query = supabase
        .from('help_center_faq')
        .select('*')
        .order('category')
        .order('sort_order');
      
      if (publishedOnly) {
        query = query.eq('is_published', true);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as HelpCenterFaq[];
    },
  });
};

export const useCreateFaq = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (faq: HelpCenterFaqInsert) => {
      const { data, error } = await supabase
        .from('help_center_faq')
        .insert(faq)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-center-faqs'] });
      toast.success('FAQ created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create FAQ: ' + error.message);
    },
  });
};

export const useUpdateFaq = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & HelpCenterFaqUpdate) => {
      const { data, error } = await supabase
        .from('help_center_faq')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-center-faqs'] });
      toast.success('FAQ updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update FAQ: ' + error.message);
    },
  });
};

export const useDeleteFaq = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('help_center_faq')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['help-center-faqs'] });
      toast.success('FAQ deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete FAQ: ' + error.message);
    },
  });
};

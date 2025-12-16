import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";
import type { KeyDateCategory } from "@/components/KeyDatesGantt";

export interface OverviewContent {
  subtitle: string;
  regulation_reference: string;
  what_is_ehds: {
    title: string;
    intro: string;
    points: Array<{ title: string; description: string }>;
  };
  key_components: {
    title: string;
    items: Array<{ title: string; description: string }>;
  };
  key_dates: {
    title: string;
    dates: Array<{ label: string; date: string; category?: KeyDateCategory }>;
  };
}

export interface PageContent {
  id: string;
  title: string;
  content: OverviewContent;
  created_at: string;
  updated_at: string;
}

export const usePageContent = (pageId: string) => {
  return useQuery({
    queryKey: ['page-content', pageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('id', pageId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        content: data.content as unknown as OverviewContent,
      } as PageContent;
    },
    enabled: !!pageId,
  });
};

export const useUpdatePageContent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, title, content }: { id: string; title: string; content: OverviewContent | Record<string, unknown> }) => {
      const { error } = await supabase
        .from('page_content')
        .update({ title, content: content as unknown as Json })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['page-content', variables.id] });
    },
  });
};

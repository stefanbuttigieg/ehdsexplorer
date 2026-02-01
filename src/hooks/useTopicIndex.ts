import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TopicIndexItem {
  id: string;
  stakeholder_type: string;
  category: string;
  topic: string;
  description: string | null;
  article_numbers: number[];
  recital_numbers: number[];
  sort_order: number;
  is_active: boolean;
}

export function useTopicIndex(stakeholderType: string) {
  return useQuery({
    queryKey: ['topic-index', stakeholderType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_article_index')
        .select('*')
        .eq('stakeholder_type', stakeholderType)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TopicIndexItem[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useAllTopicIndex() {
  return useQuery({
    queryKey: ['topic-index', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_article_index')
        .select('*')
        .order('stakeholder_type', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data as TopicIndexItem[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Group topics by category
export function groupTopicsByCategory(topics: TopicIndexItem[]) {
  const grouped = topics.reduce((acc, topic) => {
    if (!acc[topic.category]) {
      acc[topic.category] = [];
    }
    acc[topic.category].push(topic);
    return acc;
  }, {} as Record<string, TopicIndexItem[]>);

  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items: items.sort((a, b) => a.sort_order - b.sort_order),
  }));
}

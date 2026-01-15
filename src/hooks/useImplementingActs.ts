import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActStatus = 'pending' | 'feedback' | 'progress' | 'adopted' | 'feedback-closed';

export type ActTheme = 
  | 'primary-use'
  | 'ehr-systems'
  | 'secondary-use'
  | 'health-data-access'
  | 'cross-border'
  | 'ehds-board';

export interface ImplementingAct {
  id: string;
  articleReference: string;
  title: string;
  description: string;
  type: 'implementing' | 'delegated';
  theme: ActTheme;
  themes: ActTheme[];
  status: ActStatus;
  feedbackDeadline?: string | null;
  adoptionDate?: string | null;
  officialLink?: string | null;
  deliverableLink?: string | null;
  deliverableName?: string | null;
  relatedArticles: number[];
}

export const themeLabels: Record<ActTheme, string> = {
  'primary-use': 'Primary Use of Health Data',
  'ehr-systems': 'EHR Systems & Certification',
  'secondary-use': 'Secondary Use Framework',
  'health-data-access': 'Health Data Access Bodies',
  'cross-border': 'Cross-Border Infrastructure',
  'ehds-board': 'EHDS Board & Governance',
};

export const statusLabels: Record<ActStatus, string> = {
  pending: 'Pending',
  feedback: 'Open for Feedback',
  'feedback-closed': 'Feedback Closed',
  progress: 'In Progress',
  adopted: 'Adopted',
};

const mapDbToAct = (row: any): ImplementingAct => {
  // Handle themes array - use themes if available, otherwise fallback to single theme
  const themesArray: ActTheme[] = row.themes && Array.isArray(row.themes) && row.themes.length > 0
    ? row.themes as ActTheme[]
    : row.theme ? [row.theme as ActTheme] : [];
  
  return {
    id: row.id,
    articleReference: row.article_reference,
    title: row.title,
    description: row.description,
    type: row.type as 'implementing' | 'delegated',
    theme: themesArray[0] || row.theme as ActTheme, // Keep for backward compatibility
    themes: themesArray,
    status: row.status as ActStatus,
    feedbackDeadline: row.feedback_deadline,
    officialLink: row.official_link,
    deliverableLink: row.deliverable_link,
    relatedArticles: row.related_articles || [],
  };
};

export const useImplementingActs = () => {
  return useQuery({
    queryKey: ['implementing-acts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_acts')
        .select('*')
        .order('article_reference');

      if (error) throw error;
      return data.map(mapDbToAct);
    },
  });
};

export const useImplementingAct = (id: string) => {
  return useQuery({
    queryKey: ['implementing-act', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_acts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data ? mapDbToAct(data) : null;
    },
    enabled: !!id,
  });
};

export const getActStats = (acts: ImplementingAct[]): Record<ActStatus, number> => {
  return acts.reduce((acc, act) => {
    acc[act.status] = (acc[act.status] || 0) + 1;
    return acc;
  }, {} as Record<ActStatus, number>);
};

export const getActsByArticle = (acts: ImplementingAct[], articleId: number): ImplementingAct[] => {
  return acts.filter((a) => a.relatedArticles.includes(articleId));
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ContentType = 'article' | 'recital' | 'definition' | 'annex' | 'chapter' | 'section' | 'implementing_act' | 'implementing_act_article' | 'implementing_act_recital' | 'news';

interface TranslationConfig {
  table: string;
  idColumn: string;
}

const translationConfigs: Record<ContentType, TranslationConfig> = {
  article: { table: 'article_translations', idColumn: 'article_id' },
  recital: { table: 'recital_translations', idColumn: 'recital_id' },
  definition: { table: 'definition_translations', idColumn: 'definition_id' },
  annex: { table: 'annex_translations', idColumn: 'annex_id' },
  chapter: { table: 'chapter_translations', idColumn: 'chapter_id' },
  section: { table: 'section_translations', idColumn: 'section_id' },
  implementing_act: { table: 'implementing_act_translations', idColumn: 'implementing_act_id' },
  implementing_act_article: { table: 'implementing_act_article_translations', idColumn: 'article_id' },
  implementing_act_recital: { table: 'implementing_act_recital_translations', idColumn: 'recital_id' },
  news: { table: 'news_summary_translations', idColumn: 'news_id' },
};

// Fetch all translations for a specific content type and language
// Note: Full functionality available after database types regeneration
export function useTranslationsForLanguage(contentType: ContentType, languageCode: string) {
  return useQuery({
    queryKey: ['translations', contentType, languageCode],
    queryFn: async () => {
      // Return empty array until types are regenerated
      // The translation tables exist but TypeScript types need updating
      console.info(`Translation query for ${contentType} in ${languageCode} - pending types update`);
      return [];
    },
    enabled: !!languageCode && languageCode !== 'en',
  });
}

// Fetch translation for a specific content item
export function useTranslation(contentType: ContentType, contentId: string | number, languageCode: string) {
  const config = translationConfigs[contentType];

  return useQuery({
    queryKey: ['translation', contentType, contentId, languageCode],
    queryFn: async () => {
      // Placeholder - will work after types regeneration
      return null;
    },
    enabled: !!contentId && !!languageCode && languageCode !== 'en',
  });
}

// Create or update translation - placeholder until types regeneration
export function useSaveTranslation(contentType: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (translation: {
      contentId: string | number;
      languageCode: string;
      data: Record<string, any>;
      isPublished?: boolean;
    }) => {
      // Will be implemented after types regeneration
      throw new Error('Translation save not yet available - types need regeneration');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['translations', contentType] });
      toast.success('Translation saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save translation: ' + (error as Error).message);
    },
  });
}

// Delete translation - placeholder
export function useDeleteTranslation(contentType: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (translationId: string) => {
      throw new Error('Translation delete not yet available - types need regeneration');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations', contentType] });
      toast.success('Translation deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete translation: ' + (error as Error).message);
    },
  });
}

// Publish/unpublish translation - placeholder
export function useToggleTranslationPublish(contentType: ContentType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ translationId, isPublished }: { translationId: string; isPublished: boolean }) => {
      throw new Error('Translation publish toggle not yet available - types need regeneration');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translations', contentType] });
      toast.success('Translation status updated');
    },
    onError: (error) => {
      toast.error('Failed to update translation status: ' + (error as Error).message);
    },
  });
}

// Get translation statistics for a language - placeholder
export function useTranslationStats(languageCode: string) {
  return useQuery({
    queryKey: ['translation-stats', languageCode],
    queryFn: async () => {
      // Return empty stats for now
      return {
        article: { total: 105, translated: 0, published: 0 },
        recital: { total: 115, translated: 0, published: 0 },
        definition: { total: 62, translated: 0, published: 0 },
        annex: { total: 5, translated: 0, published: 0 },
        chapter: { total: 10, translated: 0, published: 0 },
        section: { total: 15, translated: 0, published: 0 },
      };
    },
    enabled: !!languageCode && languageCode !== 'en',
  });
}

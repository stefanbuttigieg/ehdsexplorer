import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

type ContentType = 'article' | 'recital' | 'definition' | 'annex' | 'chapter' | 'section' | 'implementing_act' | 'news';

interface TranslationResult<T> {
  content: T | null;
  translation: any | null;
  isTranslated: boolean;
  isFallback: boolean;
  isLoading: boolean;
}

// Hook to fetch article with translation
export function useTranslatedArticle(articleNumber: number) {
  const { currentLanguage } = useLanguage();

  const { data: article, isLoading: articleLoading } = useQuery({
    queryKey: ['article', articleNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('article_number', articleNumber)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: translation, isLoading: translationLoading } = useQuery({
    queryKey: ['article-translation', article?.id, currentLanguage],
    queryFn: async () => {
      if (!article?.id || currentLanguage === 'en') return null;
      
      const { data } = await supabase
        .from('article_translations')
        .select('*')
        .eq('article_id', article.id)
        .eq('language_code', currentLanguage)
        .eq('is_published', true)
        .single();
      
      return data;
    },
    enabled: !!article?.id && currentLanguage !== 'en',
  });

  const isTranslated = !!translation;
  const isFallback = currentLanguage !== 'en' && !translation;

  return {
    article: article ? {
      ...article,
      title: translation?.title || article.title,
      content: translation?.content || article.content,
    } : null,
    originalArticle: article,
    translation,
    isTranslated,
    isFallback,
    isLoading: articleLoading || translationLoading,
    currentLanguage,
  };
}

// Hook to fetch recital with translation
export function useTranslatedRecital(recitalNumber: number) {
  const { currentLanguage } = useLanguage();

  const { data: recital, isLoading: recitalLoading } = useQuery({
    queryKey: ['recital', recitalNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recitals')
        .select('*')
        .eq('recital_number', recitalNumber)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: translation, isLoading: translationLoading } = useQuery({
    queryKey: ['recital-translation', recital?.id, currentLanguage],
    queryFn: async () => {
      if (!recital?.id || currentLanguage === 'en') return null;
      
      const { data } = await supabase
        .from('recital_translations')
        .select('*')
        .eq('recital_id', recital.id)
        .eq('language_code', currentLanguage)
        .eq('is_published', true)
        .single();
      
      return data;
    },
    enabled: !!recital?.id && currentLanguage !== 'en',
  });

  const isTranslated = !!translation;
  const isFallback = currentLanguage !== 'en' && !translation;

  return {
    recital: recital ? {
      ...recital,
      content: translation?.content || recital.content,
    } : null,
    originalRecital: recital,
    translation,
    isTranslated,
    isFallback,
    isLoading: recitalLoading || translationLoading,
    currentLanguage,
  };
}

// Hook to fetch definition with translation
export function useTranslatedDefinition(definitionId: number) {
  const { currentLanguage } = useLanguage();

  const { data: definition, isLoading: definitionLoading } = useQuery({
    queryKey: ['definition', definitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('definitions')
        .select('*')
        .eq('id', definitionId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: translation, isLoading: translationLoading } = useQuery({
    queryKey: ['definition-translation', definitionId, currentLanguage],
    queryFn: async () => {
      if (currentLanguage === 'en') return null;
      
      const { data } = await supabase
        .from('definition_translations')
        .select('*')
        .eq('definition_id', definitionId)
        .eq('language_code', currentLanguage)
        .eq('is_published', true)
        .single();
      
      return data;
    },
    enabled: currentLanguage !== 'en',
  });

  const isTranslated = !!translation;
  const isFallback = currentLanguage !== 'en' && !translation;

  return {
    definition: definition ? {
      ...definition,
      term: translation?.term || definition.term,
      definition: translation?.definition || definition.definition,
    } : null,
    originalDefinition: definition,
    translation,
    isTranslated,
    isFallback,
    isLoading: definitionLoading || translationLoading,
    currentLanguage,
  };
}

// Hook to fetch all definitions with translations
export function useTranslatedDefinitions() {
  const { currentLanguage } = useLanguage();

  const { data: definitions, isLoading: definitionsLoading } = useQuery({
    queryKey: ['definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('definitions')
        .select('*')
        .order('term');
      if (error) throw error;
      return data;
    },
  });

  const { data: translations, isLoading: translationsLoading } = useQuery({
    queryKey: ['definition-translations', currentLanguage],
    queryFn: async () => {
      if (currentLanguage === 'en') return [];
      
      const { data } = await supabase
        .from('definition_translations')
        .select('*')
        .eq('language_code', currentLanguage)
        .eq('is_published', true);
      
      return data || [];
    },
    enabled: currentLanguage !== 'en',
  });

  const translationsMap = new Map(
    (translations || []).map(t => [t.definition_id, t])
  );

  const translatedDefinitions = definitions?.map(def => {
    const translation = translationsMap.get(def.id);
    return {
      ...def,
      term: translation?.term || def.term,
      definition: translation?.definition || def.definition,
      isTranslated: !!translation,
    };
  });

  return {
    definitions: translatedDefinitions || [],
    isLoading: definitionsLoading || translationsLoading,
    currentLanguage,
  };
}

// Hook to check translation coverage for a content type
export function useTranslationCoverage(contentType: ContentType) {
  const { currentLanguage } = useLanguage();

  return useQuery({
    queryKey: ['translation-coverage', contentType, currentLanguage],
    queryFn: async () => {
      if (currentLanguage === 'en') {
        return { total: 0, translated: 0, percentage: 100 };
      }

      // Return placeholder data until types are regenerated
      const totals: Record<ContentType, number> = {
        article: 105,
        recital: 115,
        definition: 62,
        annex: 5,
        chapter: 10,
        section: 15,
        implementing_act: 30,
        news: 10,
      };

      return {
        total: totals[contentType] || 0,
        translated: 0,
        percentage: 0,
      };
    },
    enabled: currentLanguage !== 'en',
  });
}

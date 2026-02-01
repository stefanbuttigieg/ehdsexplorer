import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStakeholder } from "@/contexts/StakeholderContext";
import { useMemo } from "react";

export interface Article {
  id: number;
  article_number: number;
  title: string;
  content: string;
  chapter_id: number | null;
  stakeholder_tags: string[] | null;
  is_key_provision: boolean | null;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, article_number, title, content, chapter_id, stakeholder_tags, is_key_provision")
        .order("article_number", { ascending: true });

      if (error) throw error;
      return data as Article[];
    },
  });
};

// Hook that returns articles filtered by current stakeholder
export const useFilteredArticles = () => {
  const { data: articles, isLoading, error } = useArticles();
  const { activeStakeholder, isRelevantToStakeholder } = useStakeholder();

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    if (!activeStakeholder) return articles;
    return articles.filter(article => isRelevantToStakeholder(article.stakeholder_tags));
  }, [articles, activeStakeholder, isRelevantToStakeholder]);

  const keyProvisions = useMemo(() => {
    if (!articles || !activeStakeholder) return [];
    return articles.filter(
      article => 
        article.is_key_provision && 
        isRelevantToStakeholder(article.stakeholder_tags)
    );
  }, [articles, activeStakeholder, isRelevantToStakeholder]);

  return {
    articles: filteredArticles,
    allArticles: articles || [],
    keyProvisions,
    isLoading,
    error,
    isFiltered: !!activeStakeholder,
    totalCount: articles?.length || 0,
    filteredCount: filteredArticles.length,
  };
};

export const useArticle = (articleNumber: number) => {
  return useQuery({
    queryKey: ["article", articleNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, article_number, title, content, chapter_id, stakeholder_tags, is_key_provision")
        .eq("article_number", articleNumber)
        .maybeSingle();

      if (error) throw error;
      return data as Article | null;
    },
    enabled: !!articleNumber,
  });
};

// Helper functions for compatibility
export const getArticleById = (articles: Article[], id: number): Article | undefined => {
  return articles.find((a) => a.article_number === id);
};

export const getArticlesByChapter = (articles: Article[], chapterId: number, articleRange: [number, number]): Article[] => {
  return articles.filter(
    (a) => a.article_number >= articleRange[0] && a.article_number <= articleRange[1]
  );
};

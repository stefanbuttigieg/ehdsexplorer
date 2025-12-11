import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: number;
  article_number: number;
  title: string;
  content: string;
  chapter_id: number | null;
}

export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, article_number, title, content, chapter_id")
        .order("article_number", { ascending: true });

      if (error) throw error;
      return data as Article[];
    },
  });
};

export const useArticle = (articleNumber: number) => {
  return useQuery({
    queryKey: ["article", articleNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("id, article_number, title, content, chapter_id")
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

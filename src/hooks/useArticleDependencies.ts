import { useMemo } from "react";
import { Article } from "@/hooks/useArticles";

export interface ArticleLink {
  source: number;
  target: number;
}

export interface ArticleNode {
  articleNumber: number;
  title: string;
  inDegree: number;
  outDegree: number;
}

/**
 * Parses article content to find references to other articles.
 * Matches patterns like "Article 5", "Articles 3 and 4", "Article 10(2)", etc.
 */
const extractArticleReferences = (content: string, ownNumber: number): number[] => {
  const refs = new Set<number>();
  // Match "Article(s) N" patterns, including lists like "Articles 3, 4 and 5"
  const patterns = [
    /Articles?\s+(\d+)(?:\(\d+\))?(?:,\s*(\d+)(?:\(\d+\))?)*(?:\s+and\s+(\d+)(?:\(\d+\))?)?/gi,
    /Article\s+(\d+)(?:\(\d+\))?/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const num = parseInt(match[i], 10);
          if (num !== ownNumber && num >= 1 && num <= 105) {
            refs.add(num);
          }
        }
      }
    }
  }

  // Also catch comma-separated lists: "Articles 3, 5, 7 and 9"
  const listPattern = /Articles?\s+((?:\d+(?:\(\d+\))?,?\s*(?:and\s+)?)+)/gi;
  let listMatch;
  while ((listMatch = listPattern.exec(content)) !== null) {
    const numPattern = /(\d+)/g;
    let numMatch;
    while ((numMatch = numPattern.exec(listMatch[1])) !== null) {
      const num = parseInt(numMatch[1], 10);
      if (num !== ownNumber && num >= 1 && num <= 105) {
        refs.add(num);
      }
    }
  }

  return Array.from(refs).sort((a, b) => a - b);
};

export const useArticleDependencies = (articles: Article[] | undefined) => {
  return useMemo(() => {
    if (!articles || articles.length === 0) {
      return { nodes: [], links: [], stats: { totalLinks: 0, mostReferenced: null, mostReferencing: null } };
    }

    const links: ArticleLink[] = [];
    const inDegreeMap = new Map<number, number>();
    const outDegreeMap = new Map<number, number>();

    // Initialize all articles
    for (const article of articles) {
      inDegreeMap.set(article.article_number, 0);
      outDegreeMap.set(article.article_number, 0);
    }

    // Extract references
    const seenLinks = new Set<string>();
    for (const article of articles) {
      const refs = extractArticleReferences(article.content, article.article_number);
      for (const ref of refs) {
        const key = `${article.article_number}->${ref}`;
        if (!seenLinks.has(key) && inDegreeMap.has(ref)) {
          seenLinks.add(key);
          links.push({ source: article.article_number, target: ref });
          outDegreeMap.set(article.article_number, (outDegreeMap.get(article.article_number) || 0) + 1);
          inDegreeMap.set(ref, (inDegreeMap.get(ref) || 0) + 1);
        }
      }
    }

    const nodes: ArticleNode[] = articles.map((a) => ({
      articleNumber: a.article_number,
      title: a.title,
      inDegree: inDegreeMap.get(a.article_number) || 0,
      outDegree: outDegreeMap.get(a.article_number) || 0,
    }));

    // Stats
    const mostReferenced = nodes.reduce((max, n) => (n.inDegree > (max?.inDegree || 0) ? n : max), nodes[0]);
    const mostReferencing = nodes.reduce((max, n) => (n.outDegree > (max?.outDegree || 0) ? n : max), nodes[0]);

    return {
      nodes,
      links,
      stats: {
        totalLinks: links.length,
        mostReferenced: mostReferenced || null,
        mostReferencing: mostReferencing || null,
      },
    };
  }, [articles]);
};

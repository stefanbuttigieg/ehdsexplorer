import { useMemo } from 'react';
import Fuse, { FuseResult, IFuseOptions } from 'fuse.js';
import { useArticles } from './useArticles';
import { useRecitals } from './useRecitals';
import { useDefinitions } from './useDefinitions';
import { useChapters } from './useChapters';
import { useImplementingActs } from './useImplementingActs';
import { useAnnexes } from './useAnnexes';

// Helper functions for Roman numerals
export const romanToNumber = (roman: string): number => {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100 };
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const curr = map[roman[i]] || 0;
    const next = map[roman[i + 1]] || 0;
    result += curr < next ? -curr : curr;
  }
  return result;
};

export const numberToRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

// Normalize text for better search matching
const normalizeText = (text: string): string => {
  return text
    .replace(/[#*`_]/g, ' ')  // Remove markdown formatting
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .trim();
};

// Extract keywords from article numbers
const generateArticleSearchTerms = (articleNumber: number): string => {
  return `article ${articleNumber} art ${articleNumber} art. ${articleNumber} Article${articleNumber}`;
};

const generateRecitalSearchTerms = (recitalNumber: number): string => {
  return `recital ${recitalNumber} rec ${recitalNumber} rec. ${recitalNumber} Recital${recitalNumber}`;
};

const generateChapterSearchTerms = (chapterNumber: number): string => {
  const roman = numberToRoman(chapterNumber);
  return `chapter ${chapterNumber} ch ${chapterNumber} ch. ${chapterNumber} Chapter${chapterNumber} ${roman}`;
};

const generateAnnexSearchTerms = (annexId: string): string => {
  const num = romanToNumber(annexId);
  return `annex ${annexId} annex ${num} Annex${annexId} Annex${num}`;
};

// Improved Fuse.js options with better scoring
const createFuseOptions = <T>(keys: Array<{name: keyof T | string; weight: number}>): IFuseOptions<T> => ({
  keys: keys.map(k => ({ name: k.name as string, weight: k.weight })),
  threshold: 0.35,          // Balanced threshold for accuracy
  distance: 200,            // Search further into the text
  ignoreLocation: true,     // Match anywhere in the field
  includeScore: true,       // Include match scores
  includeMatches: true,     // Include match indices for highlighting
  minMatchCharLength: 2,    // Minimum characters to match
  useExtendedSearch: false,
  findAllMatches: true,     // Find all matches, not just first
});

export interface SearchableArticle {
  id: number;
  article_number: number;
  title: string;
  content: string;
  normalizedContent: string;
  searchTerms: string;
  chapter_id: number | null;
}

export interface SearchableRecital {
  id: number;
  recital_number: number;
  content: string;
  normalizedContent: string;
  searchTerms: string;
  related_articles: number[] | null;
}

export interface SearchableDefinition {
  id: number;
  term: string;
  definition: string;
  normalizedDefinition: string;
  source_article: number | null;
}

export interface SearchableChapter {
  id: number;
  chapter_number: number;
  title: string;
  description: string | null;
  normalizedDescription: string;
  searchTerms: string;
}

export interface SearchableImplementingAct {
  id: string;
  title: string;
  description: string;
  normalizedDescription: string;
  articleReference: string;
  type: string;
  theme: string;
  status: string;
  searchTerms: string;
}

export interface SearchableAnnex {
  id: string;
  title: string;
  content: string;
  normalizedContent: string;
  searchTerms: string;
}

export interface SearchResults {
  articles: FuseResult<SearchableArticle>[];
  recitals: FuseResult<SearchableRecital>[];
  definitions: FuseResult<SearchableDefinition>[];
  chapters: FuseResult<SearchableChapter>[];
  implementingActs: FuseResult<SearchableImplementingAct>[];
  annexes: FuseResult<SearchableAnnex>[];
}

export interface UseSearchReturn {
  search: (query: string) => SearchResults;
  searchArticles: (query: string) => FuseResult<SearchableArticle>[];
  searchRecitals: (query: string) => FuseResult<SearchableRecital>[];
  searchDefinitions: (query: string) => FuseResult<SearchableDefinition>[];
  searchChapters: (query: string) => FuseResult<SearchableChapter>[];
  searchImplementingActs: (query: string) => FuseResult<SearchableImplementingAct>[];
  searchAnnexes: (query: string) => FuseResult<SearchableAnnex>[];
  isLoading: boolean;
  data: {
    articles: SearchableArticle[];
    recitals: SearchableRecital[];
    definitions: SearchableDefinition[];
    chapters: SearchableChapter[];
    implementingActs: SearchableImplementingAct[];
    annexes: SearchableAnnex[];
  };
}

// Direct ID match patterns
const matchPatterns = {
  article: /^(?:article|art\.?)\s*(\d+)$/i,
  recital: /^(?:recital|rec\.?)\s*(\d+)$/i,
  chapter: /^(?:chapter|ch\.?)\s*(\d+)$/i,
  annex: /^(?:annex)\s*([IVXivx]+|\d+)$/i,
  // Also match standalone numbers to prioritize articles
  number: /^(\d+)$/,
};

export const useSearch = (): UseSearchReturn => {
  const { data: rawArticles = [], isLoading: articlesLoading } = useArticles();
  const { data: rawRecitals = [], isLoading: recitalsLoading } = useRecitals();
  const { data: rawDefinitions = [], isLoading: definitionsLoading } = useDefinitions();
  const { data: rawChapters = [], isLoading: chaptersLoading } = useChapters();
  const { data: rawImplementingActs = [], isLoading: actsLoading } = useImplementingActs();
  const { data: rawAnnexes = [], isLoading: annexesLoading } = useAnnexes();

  const isLoading = articlesLoading || recitalsLoading || definitionsLoading || 
                    chaptersLoading || actsLoading || annexesLoading;

  // Prepare searchable data with normalized content
  const searchableData = useMemo(() => ({
    articles: rawArticles.map(a => ({
      id: a.id,
      article_number: a.article_number,
      title: a.title,
      content: a.content,
      normalizedContent: normalizeText(a.content),
      searchTerms: generateArticleSearchTerms(a.article_number),
      chapter_id: a.chapter_id,
    })),
    recitals: rawRecitals.map(r => ({
      id: r.id,
      recital_number: r.recital_number,
      content: r.content,
      normalizedContent: normalizeText(r.content),
      searchTerms: generateRecitalSearchTerms(r.recital_number),
      related_articles: r.related_articles,
    })),
    definitions: rawDefinitions.map(d => ({
      id: d.id,
      term: d.term,
      definition: d.definition,
      normalizedDefinition: normalizeText(d.definition),
      source_article: d.source_article,
    })),
    chapters: rawChapters.map(c => ({
      id: c.id,
      chapter_number: c.chapter_number,
      title: c.title,
      description: c.description,
      normalizedDescription: normalizeText(c.description || ''),
      searchTerms: generateChapterSearchTerms(c.chapter_number),
    })),
    implementingActs: rawImplementingActs.map(a => ({
      id: a.id,
      title: a.title,
      description: a.description,
      normalizedDescription: normalizeText(a.description),
      articleReference: a.articleReference,
      type: a.type,
      theme: a.theme,
      status: a.status,
      searchTerms: `${a.articleReference} implementing delegated act ${a.type} ${a.theme}`,
    })),
    annexes: rawAnnexes.map(a => ({
      id: a.id,
      title: a.title,
      content: a.content,
      normalizedContent: normalizeText(a.content),
      searchTerms: generateAnnexSearchTerms(a.id),
    })),
  }), [rawArticles, rawRecitals, rawDefinitions, rawChapters, rawImplementingActs, rawAnnexes]);

  // Create Fuse instances with optimized options
  const fuseInstances = useMemo(() => ({
    articles: new Fuse(searchableData.articles, createFuseOptions<SearchableArticle>([
      { name: 'searchTerms', weight: 2.0 },  // Highest priority for ID matches
      { name: 'title', weight: 1.5 },        // High priority for title
      { name: 'normalizedContent', weight: 1.0 },  // Content search
    ])),
    recitals: new Fuse(searchableData.recitals, createFuseOptions<SearchableRecital>([
      { name: 'searchTerms', weight: 2.0 },
      { name: 'normalizedContent', weight: 1.0 },
    ])),
    definitions: new Fuse(searchableData.definitions, createFuseOptions<SearchableDefinition>([
      { name: 'term', weight: 2.0 },         // Exact term match is most important
      { name: 'normalizedDefinition', weight: 1.0 },
    ])),
    chapters: new Fuse(searchableData.chapters, createFuseOptions<SearchableChapter>([
      { name: 'searchTerms', weight: 2.0 },
      { name: 'title', weight: 1.5 },
      { name: 'normalizedDescription', weight: 1.0 },
    ])),
    implementingActs: new Fuse(searchableData.implementingActs, createFuseOptions<SearchableImplementingAct>([
      { name: 'searchTerms', weight: 1.5 },
      { name: 'title', weight: 1.5 },
      { name: 'articleReference', weight: 1.2 },
      { name: 'normalizedDescription', weight: 1.0 },
      { name: 'theme', weight: 0.8 },
      { name: 'type', weight: 0.5 },
    ])),
    annexes: new Fuse(searchableData.annexes, createFuseOptions<SearchableAnnex>([
      { name: 'searchTerms', weight: 2.0 },
      { name: 'title', weight: 1.5 },
      { name: 'normalizedContent', weight: 1.0 },
    ])),
  }), [searchableData]);

  // Check for direct ID matches
  const checkDirectMatch = (query: string) => {
    const trimmed = query.trim();
    
    const articleMatch = trimmed.match(matchPatterns.article);
    if (articleMatch) {
      const num = parseInt(articleMatch[1]);
      const article = searchableData.articles.find(a => a.article_number === num);
      return article ? { type: 'article', item: article } : null;
    }

    const recitalMatch = trimmed.match(matchPatterns.recital);
    if (recitalMatch) {
      const num = parseInt(recitalMatch[1]);
      const recital = searchableData.recitals.find(r => r.recital_number === num);
      return recital ? { type: 'recital', item: recital } : null;
    }

    const chapterMatch = trimmed.match(matchPatterns.chapter);
    if (chapterMatch) {
      const num = parseInt(chapterMatch[1]);
      const chapter = searchableData.chapters.find(c => c.chapter_number === num);
      return chapter ? { type: 'chapter', item: chapter } : null;
    }

    const annexMatch = trimmed.match(matchPatterns.annex);
    if (annexMatch) {
      const input = annexMatch[1].toUpperCase();
      const annexId = /^\d+$/.test(input) ? numberToRoman(parseInt(input)) : input;
      const annex = searchableData.annexes.find(a => a.id === annexId);
      return annex ? { type: 'annex', item: annex } : null;
    }

    // Check for standalone number - prioritize article match
    const numberMatch = trimmed.match(matchPatterns.number);
    if (numberMatch) {
      const num = parseInt(numberMatch[1]);
      const article = searchableData.articles.find(a => a.article_number === num);
      if (article) {
        return { type: 'article', item: article };
      }
    }

    return null;
  };

  const searchArticles = (query: string): FuseResult<SearchableArticle>[] => {
    if (!query.trim()) return [];
    const directMatch = checkDirectMatch(query);
    if (directMatch?.type === 'article') {
      return [{ item: directMatch.item as SearchableArticle, refIndex: 0, score: 0 }];
    }
    return fuseInstances.articles.search(query);
  };

  const searchRecitals = (query: string): FuseResult<SearchableRecital>[] => {
    if (!query.trim()) return [];
    const directMatch = checkDirectMatch(query);
    if (directMatch?.type === 'recital') {
      return [{ item: directMatch.item as SearchableRecital, refIndex: 0, score: 0 }];
    }
    return fuseInstances.recitals.search(query);
  };

  const searchDefinitions = (query: string): FuseResult<SearchableDefinition>[] => {
    if (!query.trim()) return [];
    return fuseInstances.definitions.search(query);
  };

  const searchChapters = (query: string): FuseResult<SearchableChapter>[] => {
    if (!query.trim()) return [];
    const directMatch = checkDirectMatch(query);
    if (directMatch?.type === 'chapter') {
      return [{ item: directMatch.item as SearchableChapter, refIndex: 0, score: 0 }];
    }
    return fuseInstances.chapters.search(query);
  };

  const searchImplementingActs = (query: string): FuseResult<SearchableImplementingAct>[] => {
    if (!query.trim()) return [];
    return fuseInstances.implementingActs.search(query);
  };

  const searchAnnexes = (query: string): FuseResult<SearchableAnnex>[] => {
    if (!query.trim()) return [];
    const directMatch = checkDirectMatch(query);
    if (directMatch?.type === 'annex') {
      return [{ item: directMatch.item as SearchableAnnex, refIndex: 0, score: 0 }];
    }
    return fuseInstances.annexes.search(query);
  };

  const search = (query: string): SearchResults => {
    if (!query.trim()) {
      return {
        articles: [],
        recitals: [],
        definitions: [],
        chapters: [],
        implementingActs: [],
        annexes: [],
      };
    }

    // Check for direct ID match first
    const directMatch = checkDirectMatch(query);
    if (directMatch) {
      const emptyResults: SearchResults = {
        articles: [],
        recitals: [],
        definitions: [],
        chapters: [],
        implementingActs: [],
        annexes: [],
      };
      
      switch (directMatch.type) {
        case 'article':
          emptyResults.articles = [{ item: directMatch.item as SearchableArticle, refIndex: 0, score: 0 }];
          break;
        case 'recital':
          emptyResults.recitals = [{ item: directMatch.item as SearchableRecital, refIndex: 0, score: 0 }];
          break;
        case 'chapter':
          emptyResults.chapters = [{ item: directMatch.item as SearchableChapter, refIndex: 0, score: 0 }];
          break;
        case 'annex':
          emptyResults.annexes = [{ item: directMatch.item as SearchableAnnex, refIndex: 0, score: 0 }];
          break;
      }
      return emptyResults;
    }

    return {
      articles: searchArticles(query),
      recitals: searchRecitals(query),
      definitions: searchDefinitions(query),
      chapters: searchChapters(query),
      implementingActs: searchImplementingActs(query),
      annexes: searchAnnexes(query),
    };
  };

  return {
    search,
    searchArticles,
    searchRecitals,
    searchDefinitions,
    searchChapters,
    searchImplementingActs,
    searchAnnexes,
    isLoading,
    data: searchableData,
  };
};

// Utility function to get context snippet around a match
export const getMatchContext = (text: string, query: string, contextLength: number = 100): string => {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Find the first occurrence
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  
  if (matchIndex === -1) {
    // No exact match, return start of text
    return text.substring(0, contextLength * 2) + (text.length > contextLength * 2 ? '...' : '');
  }

  // Calculate context window
  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + query.length + contextLength);
  
  let snippet = text.substring(start, end);
  
  // Add ellipsis if truncated
  if (start > 0) snippet = '...' + snippet;
  if (end < text.length) snippet = snippet + '...';
  
  return snippet;
};

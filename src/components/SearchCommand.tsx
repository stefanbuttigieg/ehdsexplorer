import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Book, Layers, ScrollText, FileStack, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useArticles } from "@/hooks/useArticles";
import { useImplementingActs } from "@/hooks/useImplementingActs";
import { useAnnexes } from "@/hooks/useAnnexes";
import { useChapters } from "@/hooks/useChapters";
import { recitals } from "@/data/recitals";
import { definitions } from "@/data/definitions";
import { HighlightedText } from "@/components/HighlightedText";
import Fuse from "fuse.js";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper functions for Roman numerals
const romanToNumber = (roman: string): number => {
  const map: Record<string, number> = { I: 1, V: 5, X: 10 };
  let result = 0;
  for (let i = 0; i < roman.length; i++) {
    const curr = map[roman[i]] || 0;
    const next = map[roman[i + 1]] || 0;
    result += curr < next ? -curr : curr;
  }
  return result;
};

const numberToRoman = (num: number): string => {
  const romanNumerals: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  for (const [value, symbol] of romanNumerals) {
    while (num >= value) {
      result += symbol;
      num -= value;
    }
  }
  return result;
};

export const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: articles = [] } = useArticles();
  const { data: implementingActs = [] } = useImplementingActs();
  const { data: annexes = [] } = useAnnexes();
  const { data: chapters = [] } = useChapters();

  // Create searchable data with ID variations
  const searchableData = useMemo(() => ({
    articles: articles.map(a => ({
      ...a,
      id: a.article_number,
      searchId: `article ${a.article_number} art ${a.article_number} art. ${a.article_number}`,
    })),
    recitals: recitals.map(r => ({
      ...r,
      searchId: `recital ${r.id} rec ${r.id}`,
    })),
    chapters: chapters.map(c => ({
      ...c,
      searchId: `chapter ${c.chapter_number} ch ${c.chapter_number}`,
    })),
    acts: implementingActs.map(a => ({
      ...a,
      searchId: `${a.articleReference} implementing delegated act`,
    })),
    annexes: annexes.map(a => ({
      ...a,
      searchId: `annex ${a.id} annex ${romanToNumber(a.id)}`,
    })),
  }), [articles, implementingActs, annexes, chapters]);

  const fuse = useMemo(() => ({
    articles: new Fuse(searchableData.articles, { 
      keys: ['title', 'content', 'searchId'], 
      threshold: 0.3,
      ignoreLocation: true,
    }),
    recitals: new Fuse(searchableData.recitals, { 
      keys: ['content', 'searchId'], 
      threshold: 0.3,
      ignoreLocation: true,
    }),
    definitions: new Fuse(definitions, { 
      keys: ['term', 'definition'], 
      threshold: 0.3 
    }),
    chapters: new Fuse(searchableData.chapters, {
      keys: ['title', 'description', 'searchId'],
      threshold: 0.3,
      ignoreLocation: true,
    }),
    acts: new Fuse(searchableData.acts, {
      keys: ['title', 'description', 'articleReference', 'searchId'],
      threshold: 0.3,
      ignoreLocation: true,
    }),
    annexes: new Fuse(searchableData.annexes, {
      keys: ['title', 'content', 'searchId'],
      threshold: 0.3,
      ignoreLocation: true,
    }),
  }), [searchableData]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        articles: searchableData.articles.slice(0, 5),
        recitals: recitals.slice(0, 3),
        definitions: definitions.slice(0, 3),
        chapters: searchableData.chapters.slice(0, 3),
        acts: implementingActs.slice(0, 3),
        annexes: annexes.slice(0, 2),
      };
    }

    // Check for direct ID match patterns
    const articleMatch = query.match(/^(?:article|art\.?)\s*(\d+)$/i);
    const recitalMatch = query.match(/^(?:recital|rec\.?)\s*(\d+)$/i);
    const chapterMatch = query.match(/^(?:chapter|ch\.?)\s*(\d+)$/i);
    const annexMatch = query.match(/^(?:annex)\s*([IVX]+|\d+)$/i);
    
    if (articleMatch) {
      const id = parseInt(articleMatch[1]);
      const article = searchableData.articles.find(a => a.id === id);
      return {
        articles: article ? [article] : [],
        recitals: [],
        definitions: [],
        chapters: [],
        acts: [],
        annexes: [],
      };
    }
    
    if (recitalMatch) {
      const id = parseInt(recitalMatch[1]);
      const recital = recitals.find(r => r.id === id);
      return {
        articles: [],
        recitals: recital ? [recital] : [],
        definitions: [],
        chapters: [],
        acts: [],
        annexes: [],
      };
    }

    if (chapterMatch) {
      const id = parseInt(chapterMatch[1]);
      const chapter = chapters.find(c => c.chapter_number === id);
      return {
        articles: [],
        recitals: [],
        definitions: [],
        chapters: chapter ? [chapter] : [],
        acts: [],
        annexes: [],
      };
    }

    if (annexMatch) {
      const input = annexMatch[1].toUpperCase();
      const annexId = /^\d+$/.test(input) ? numberToRoman(parseInt(input)) : input;
      const annex = annexes.find(a => a.id === annexId);
      return {
        articles: [],
        recitals: [],
        definitions: [],
        chapters: [],
        acts: [],
        annexes: annex ? [annex] : [],
      };
    }

    return {
      articles: fuse.articles.search(query).slice(0, 5).map(r => r.item),
      recitals: fuse.recitals.search(query).slice(0, 3).map(r => r.item),
      definitions: fuse.definitions.search(query).slice(0, 3).map(r => r.item),
      chapters: fuse.chapters.search(query).slice(0, 3).map(r => r.item),
      acts: fuse.acts.search(query).slice(0, 3).map(r => r.item),
      annexes: fuse.annexes.search(query).slice(0, 2).map(r => r.item),
    };
  }, [query, fuse, searchableData, implementingActs, annexes, chapters]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    setQuery("");
    navigate(path);
  };

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search articles, chapters, implementing acts..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {results.chapters.length > 0 && (
          <CommandGroup heading="Chapters">
            {results.chapters.map(chapter => (
              <CommandItem
                key={`ch-${chapter.id}`}
                value={`chapter-${chapter.chapter_number}-${chapter.title}`}
                onSelect={() => handleSelect(`/chapter/${chapter.chapter_number}`)}
              >
                <Layers className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium mr-2 flex-shrink-0">Chapter {chapter.chapter_number}</span>
                <HighlightedText 
                  text={chapter.title} 
                  query={query} 
                  className="text-muted-foreground truncate"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.articles.length > 0 && (
          <CommandGroup heading="Articles">
            {results.articles.map(article => (
              <CommandItem
                key={`art-${article.id}`}
                value={`article-${article.id}-${article.title}`}
                onSelect={() => handleSelect(`/article/${article.id}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <FileText className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Art. {article.id}</span>
                  <HighlightedText 
                    text={article.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && article.content && (
                  <HighlightedText 
                    text={article.content.replace(/[#*`]/g, '')} 
                    query={query} 
                    className="text-xs text-muted-foreground/70 pl-6 line-clamp-1"
                    maxLength={80}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.acts.length > 0 && (
          <CommandGroup heading="Implementing Acts">
            {results.acts.map(act => (
              <CommandItem
                key={`act-${act.id}`}
                value={`act-${act.id}-${act.title}`}
                onSelect={() => handleSelect(`/implementing-acts/${act.id}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <ScrollText className="mr-2 h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">{act.articleReference}</span>
                  <HighlightedText 
                    text={act.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && act.description && (
                  <HighlightedText 
                    text={act.description} 
                    query={query} 
                    className="text-xs text-muted-foreground/70 pl-6 line-clamp-1"
                    maxLength={80}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.annexes.length > 0 && (
          <CommandGroup heading="Annexes">
            {results.annexes.map(annex => (
              <CommandItem
                key={`annex-${annex.id}`}
                value={`annex-${annex.id}-${annex.title}`}
                onSelect={() => handleSelect(`/annex/${annex.id}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <FileStack className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Annex {annex.id}</span>
                  <HighlightedText 
                    text={annex.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && annex.content && (
                  <HighlightedText 
                    text={annex.content.replace(/[#*`]/g, '')} 
                    query={query} 
                    className="text-xs text-muted-foreground/70 pl-6 line-clamp-1"
                    maxLength={80}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.recitals.length > 0 && (
          <CommandGroup heading="Recitals">
            {results.recitals.map(recital => (
              <CommandItem
                key={`rec-${recital.id}`}
                value={`recital-${recital.id}-${recital.content.substring(0, 50)}`}
                onSelect={() => handleSelect(`/recital/${recital.id}`)}
              >
                <Scale className="mr-2 h-4 w-4 text-secondary flex-shrink-0" />
                <span className="font-medium mr-2 flex-shrink-0">Recital {recital.id}</span>
                <HighlightedText 
                  text={recital.content} 
                  query={query} 
                  className="text-muted-foreground truncate"
                  maxLength={60}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.definitions.length > 0 && (
          <CommandGroup heading="Definitions">
            {results.definitions.map((def, idx) => (
              <CommandItem
                key={`def-${idx}`}
                value={`definition-${def.term}`}
                onSelect={() => handleSelect("/definitions")}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center">
                  <Book className="mr-2 h-4 w-4 flex-shrink-0" />
                  <HighlightedText 
                    text={def.term} 
                    query={query} 
                    className="font-medium"
                  />
                </div>
                {query.trim() && def.definition && (
                  <HighlightedText 
                    text={def.definition} 
                    query={query} 
                    className="text-xs text-muted-foreground/70 pl-6 line-clamp-1"
                    maxLength={80}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {query.trim() && (
          <>
            <CommandSeparator />
            <CommandGroup forceMount>
              <CommandItem
                forceMount
                value={`view-all-results-${query}`}
                onSelect={() => handleSelect(`/search?q=${encodeURIComponent(query)}`)}
                className="justify-between bg-muted/50"
              >
                <span className="font-medium">View all results</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs">Full page</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Book, Layers, ScrollText, FileStack } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { articles } from "@/data/articles";
import { recitals } from "@/data/recitals";
import { definitions } from "@/data/definitions";
import { chapters } from "@/data/chapters";
import { implementingActs } from "@/data/implementingActs";
import { annexes } from "@/data/annexes";
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

  // Create searchable data with ID variations
  const searchableData = useMemo(() => ({
    articles: articles.map(a => ({
      ...a,
      searchId: `article ${a.id} art ${a.id} art. ${a.id}`,
    })),
    recitals: recitals.map(r => ({
      ...r,
      searchId: `recital ${r.id} rec ${r.id}`,
    })),
    chapters: chapters.map(c => ({
      ...c,
      searchId: `chapter ${c.id} ch ${c.id}`,
    })),
    acts: implementingActs.map(a => ({
      ...a,
      searchId: `${a.articleReference} implementing delegated act`,
    })),
    annexes: annexes.map(a => ({
      ...a,
      searchId: `annex ${a.id} annex ${romanToNumber(a.id)}`,
      sectionContent: a.sections.map(s => s.title + ' ' + s.content).join(' '),
    })),
  }), []);

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
      keys: ['title', 'description', 'searchId', 'sectionContent'],
      threshold: 0.3,
      ignoreLocation: true,
    }),
  }), [searchableData]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        articles: articles.slice(0, 5),
        recitals: recitals.slice(0, 3),
        definitions: definitions.slice(0, 3),
        chapters: chapters.slice(0, 3),
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
      const article = articles.find(a => a.id === id);
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
      const chapter = chapters.find(c => c.id === id);
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
      // Handle both Roman numerals and Arabic numbers
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
  }, [query, fuse]);

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
                value={`chapter-${chapter.id}-${chapter.title}`}
                onSelect={() => handleSelect(`/chapter/${chapter.id}`)}
              >
                <Layers className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium mr-2">Chapter {chapter.id}</span>
                <span className="text-muted-foreground truncate">{chapter.title}</span>
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
              >
                <FileText className="mr-2 h-4 w-4 text-primary" />
                <span className="font-medium mr-2">Art. {article.id}</span>
                <span className="text-muted-foreground truncate">{article.title}</span>
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
              >
                <ScrollText className="mr-2 h-4 w-4 text-orange-500" />
                <span className="font-medium mr-2">{act.articleReference}</span>
                <span className="text-muted-foreground truncate">{act.title}</span>
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
              >
                <FileStack className="mr-2 h-4 w-4 text-emerald-500" />
                <span className="font-medium mr-2">Annex {annex.id}</span>
                <span className="text-muted-foreground truncate">{annex.title}</span>
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
                <Scale className="mr-2 h-4 w-4 text-secondary" />
                <span className="font-medium mr-2">Recital {recital.id}</span>
                <span className="text-muted-foreground truncate">{recital.content.substring(0, 60)}...</span>
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
              >
                <Book className="mr-2 h-4 w-4" />
                <span className="font-medium">{def.term}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};

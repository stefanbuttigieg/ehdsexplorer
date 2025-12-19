import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Book, Layers, ScrollText, FileStack, ArrowRight, Clock, X, Trash2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { HighlightedText } from "@/components/HighlightedText";
import { useSearch, getMatchContext } from "@/hooks/useSearch";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = "ehds-recent-searches";
const MAX_RECENT_SEARCHES = 5;

const getRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string) => {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

const removeRecentSearch = (query: string) => {
  try {
    const recent = getRecentSearches();
    const updated = recent.filter(s => s.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
};

const clearAllRecentSearches = () => {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
};

export const SearchCommand = ({ open, onOpenChange }: SearchCommandProps) => {
  const [query, setQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  
  const { search, data, isLoading } = useSearch();

  // Load recent searches on mount and when dialog opens
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
    }
  }, [open]);

  const handleRemoveRecent = useCallback((e: React.MouseEvent, searchTerm: string) => {
    e.stopPropagation();
    removeRecentSearch(searchTerm);
    setRecentSearches(getRecentSearches());
  }, []);

  const handleClearAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    clearAllRecentSearches();
    setRecentSearches([]);
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) {
      // Show a sample of each category when no query
      return {
        articles: data.articles.slice(0, 5).map(item => ({ item, refIndex: 0 })),
        recitals: data.recitals.slice(0, 3).map(item => ({ item, refIndex: 0 })),
        definitions: data.definitions.slice(0, 3).map(item => ({ item, refIndex: 0 })),
        chapters: data.chapters.slice(0, 3).map(item => ({ item, refIndex: 0 })),
        implementingActs: data.implementingActs.slice(0, 3).map(item => ({ item, refIndex: 0 })),
        annexes: data.annexes.slice(0, 2).map(item => ({ item, refIndex: 0 })),
      };
    }
    
    const searchResults = search(query);
    return {
      articles: searchResults.articles.slice(0, 5),
      recitals: searchResults.recitals.slice(0, 3),
      definitions: searchResults.definitions.slice(0, 3),
      chapters: searchResults.chapters.slice(0, 3),
      implementingActs: searchResults.implementingActs.slice(0, 3),
      annexes: searchResults.annexes.slice(0, 2),
    };
  }, [query, search, data]);

  const handleSelect = (path: string, searchQuery?: string) => {
    if (searchQuery?.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    onOpenChange(false);
    setQuery("");
    navigate(path);
  };

  const handleRecentSelect = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const hasResults = results.chapters.length > 0 || results.articles.length > 0 || 
                     results.implementingActs.length > 0 || results.annexes.length > 0 || 
                     results.recitals.length > 0 || results.definitions.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search articles, chapters, implementing acts, recitals, definitions..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() && !hasResults && !isLoading && (
          <CommandEmpty>No results found for "{query}"</CommandEmpty>
        )}

        {/* Recent Searches - only show when no query */}
        {!query.trim() && recentSearches.length > 0 && (
          <CommandGroup 
            heading={
              <div className="flex items-center justify-between">
                <span>Recent Searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleClearAll}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            }
          >
            {recentSearches.map((searchTerm, idx) => (
              <CommandItem
                key={`recent-${idx}`}
                value={`recent-search-${searchTerm}`}
                onSelect={() => handleRecentSelect(searchTerm)}
                className="group"
              >
                <Clock className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="flex-1 truncate">{searchTerm}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleRemoveRecent(e, searchTerm)}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </Button>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        
        {results.chapters.length > 0 && (
          <CommandGroup heading="Chapters">
            {results.chapters.map(result => (
              <CommandItem
                key={`ch-${result.item.id}`}
                value={`chapter-${result.item.chapter_number}-${result.item.title}`}
                onSelect={() => handleSelect(`/chapter/${result.item.chapter_number}`)}
              >
                <Layers className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium mr-2 flex-shrink-0">Chapter {result.item.chapter_number}</span>
                <HighlightedText 
                  text={result.item.title} 
                  query={query} 
                  className="text-muted-foreground truncate"
                />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.articles.length > 0 && (
          <CommandGroup heading="Articles">
            {results.articles.map(result => (
              <CommandItem
                key={`art-${result.item.id}`}
                value={`article-${result.item.article_number}-${result.item.title}`}
                onSelect={() => handleSelect(`/article/${result.item.article_number}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <FileText className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Art. {result.item.article_number}</span>
                  <HighlightedText 
                    text={result.item.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && result.item.content && (
                  <HighlightedText 
                    text={getMatchContext(result.item.normalizedContent, query, 60)} 
                    query={query} 
                    className="text-xs text-muted-foreground/70 pl-6 line-clamp-1"
                    maxLength={80}
                  />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.implementingActs.length > 0 && (
          <CommandGroup heading="Implementing Acts">
            {results.implementingActs.map(result => (
              <CommandItem
                key={`act-${result.item.id}`}
                value={`act-${result.item.id}-${result.item.title}`}
                onSelect={() => handleSelect(`/implementing-acts/${result.item.id}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <ScrollText className="mr-2 h-4 w-4 text-secondary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">{result.item.articleReference}</span>
                  <HighlightedText 
                    text={result.item.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && result.item.description && (
                  <HighlightedText 
                    text={getMatchContext(result.item.normalizedDescription, query, 60)} 
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
            {results.annexes.map(result => (
              <CommandItem
                key={`annex-${result.item.id}`}
                value={`annex-${result.item.id}-${result.item.title}`}
                onSelect={() => handleSelect(`/annex/${result.item.id}`)}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center w-full">
                  <FileStack className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                  <span className="font-medium mr-2 flex-shrink-0">Annex {result.item.id}</span>
                  <HighlightedText 
                    text={result.item.title} 
                    query={query} 
                    className="text-muted-foreground truncate"
                  />
                </div>
                {query.trim() && result.item.content && (
                  <HighlightedText 
                    text={getMatchContext(result.item.normalizedContent, query, 60)} 
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
            {results.recitals.map(result => (
              <CommandItem
                key={`rec-${result.item.id}`}
                value={`recital-${result.item.recital_number}-${result.item.content.substring(0, 50)}`}
                onSelect={() => handleSelect(`/recital/${result.item.recital_number}`)}
              >
                <Scale className="mr-2 h-4 w-4 text-secondary flex-shrink-0" />
                <span className="font-medium mr-2 flex-shrink-0">Recital {result.item.recital_number}</span>
                <HighlightedText 
                  text={query.trim() ? getMatchContext(result.item.normalizedContent, query, 40) : result.item.content} 
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
            {results.definitions.map(result => (
              <CommandItem
                key={`def-${result.item.id}`}
                value={`definition-${result.item.term}`}
                onSelect={() => handleSelect("/definitions")}
                className="flex-col items-start gap-1"
              >
                <div className="flex items-center">
                  <Book className="mr-2 h-4 w-4 flex-shrink-0" />
                  <HighlightedText 
                    text={result.item.term} 
                    query={query} 
                    className="font-medium"
                  />
                </div>
                {query.trim() && result.item.definition && (
                  <HighlightedText 
                    text={getMatchContext(result.item.normalizedDefinition, query, 60)} 
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
                onSelect={() => handleSelect(`/search?q=${encodeURIComponent(query)}`, query)}
                className="justify-between bg-muted/50"
              >
                <span className="flex items-center">
                  <span>View all results for "<strong>{query}</strong>"</span>
                </span>
                <ArrowRight className="h-4 w-4" />
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
};

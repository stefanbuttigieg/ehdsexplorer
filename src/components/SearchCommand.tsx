import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Scale, Book, Search } from "lucide-react";
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
import Fuse from "fuse.js";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  }), [searchableData]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return {
        articles: articles.slice(0, 5),
        recitals: recitals.slice(0, 3),
        definitions: definitions.slice(0, 3),
      };
    }

    // Check for direct ID match patterns like "article 42", "art 15", "recital 5"
    const articleMatch = query.match(/^(?:article|art\.?)\s*(\d+)$/i);
    const recitalMatch = query.match(/^(?:recital|rec\.?)\s*(\d+)$/i);
    
    if (articleMatch) {
      const id = parseInt(articleMatch[1]);
      const article = articles.find(a => a.id === id);
      return {
        articles: article ? [article] : [],
        recitals: [],
        definitions: [],
      };
    }
    
    if (recitalMatch) {
      const id = parseInt(recitalMatch[1]);
      const recital = recitals.find(r => r.id === id);
      return {
        articles: [],
        recitals: recital ? [recital] : [],
        definitions: [],
      };
    }

    return {
      articles: fuse.articles.search(query).slice(0, 5).map(r => r.item),
      recitals: fuse.recitals.search(query).slice(0, 3).map(r => r.item),
      definitions: fuse.definitions.search(query).slice(0, 3).map(r => r.item),
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
        placeholder="Search articles, recitals, definitions..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
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

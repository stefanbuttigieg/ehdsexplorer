import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, FileText, Scale, Book, Layers, ScrollText, FileStack } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useArticles } from "@/hooks/useArticles";
import { recitals } from "@/data/recitals";
import { definitions } from "@/data/definitions";
import { chapters } from "@/data/chapters";
import { implementingActs } from "@/data/implementingActs";
import { annexes } from "@/data/annexes";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Fuse from "fuse.js";

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

type FilterType = 'all' | 'articles' | 'recitals' | 'definitions' | 'chapters' | 'acts' | 'annexes';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>('all');
  const { data: articles = [] } = useArticles();

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
  }), [articles]);

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
      return { articles: [], recitals: [], definitions: [], chapters: [], acts: [], annexes: [] };
    }

    // Check for direct ID match patterns
    const articleMatch = query.match(/^(?:article|art\.?)\s*(\d+)$/i);
    const recitalMatch = query.match(/^(?:recital|rec\.?)\s*(\d+)$/i);
    const chapterMatch = query.match(/^(?:chapter|ch\.?)\s*(\d+)$/i);
    const annexMatch = query.match(/^(?:annex)\s*([IVX]+|\d+)$/i);

    if (articleMatch) {
      const id = parseInt(articleMatch[1]);
      const article = articles.find(a => a.article_number === id);
      return {
        articles: article ? [{ ...article, id: article.article_number }] : [],
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
      articles: fuse.articles.search(query).map(r => r.item),
      recitals: fuse.recitals.search(query).map(r => r.item),
      definitions: fuse.definitions.search(query).map(r => r.item),
      chapters: fuse.chapters.search(query).map(r => r.item),
      acts: fuse.acts.search(query).map(r => r.item),
      annexes: fuse.annexes.search(query).map(r => r.item),
    };
  }, [query, fuse, articles]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSearchParams(value ? { q: value } : {});
  };

  const totalResults = results.articles.length + results.recitals.length + results.definitions.length + 
                       results.chapters.length + results.acts.length + results.annexes.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Search" }]} />
        <h1 className="text-3xl font-bold font-serif mb-6">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles, chapters, annexes, implementing acts..."
            className="pl-12 py-6 text-lg"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        {query && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-muted-foreground">{totalResults} results</span>
              <div className="flex flex-wrap gap-2 ml-4">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'chapters' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('chapters')}>Chapters ({results.chapters.length})</Button>
                <Button variant={filter === 'articles' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('articles')}>Articles ({results.articles.length})</Button>
                <Button variant={filter === 'acts' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('acts')}>Impl. Acts ({results.acts.length})</Button>
                <Button variant={filter === 'annexes' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('annexes')}>Annexes ({results.annexes.length})</Button>
                <Button variant={filter === 'recitals' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('recitals')}>Recitals ({results.recitals.length})</Button>
                <Button variant={filter === 'definitions' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('definitions')}>Definitions ({results.definitions.length})</Button>
              </div>
            </div>

            <div className="space-y-4">
              {(filter === 'all' || filter === 'chapters') && results.chapters.map(chapter => (
                <Link key={`ch-${chapter.id}`} to={`/chapter/${chapter.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-4 w-4 text-primary" />
                        <Badge variant="outline">Chapter {chapter.id}</Badge>
                      </div>
                      <h3 className="font-medium">{chapter.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{chapter.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'articles') && results.articles.map(article => (
                <Link key={`art-${article.id}`} to={`/article/${article.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <Badge variant="outline">Article {article.id}</Badge>
                      </div>
                      <h3 className="font-medium">{article.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{article.content.substring(0, 200)}...</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'acts') && results.acts.map(act => (
                <Link key={`act-${act.id}`} to={`/implementing-acts/${act.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ScrollText className="h-4 w-4 text-orange-500" />
                        <Badge variant="outline">{act.articleReference}</Badge>
                        <Badge variant="secondary" className="text-xs">{act.type}</Badge>
                      </div>
                      <h3 className="font-medium">{act.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{act.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'annexes') && results.annexes.map(annex => (
                <Link key={`annex-${annex.id}`} to={`/annex/${annex.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileStack className="h-4 w-4 text-emerald-500" />
                        <Badge variant="outline">Annex {annex.id}</Badge>
                      </div>
                      <h3 className="font-medium">{annex.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{annex.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'recitals') && results.recitals.map(recital => (
                <Link key={`rec-${recital.id}`} to={`/recital/${recital.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="h-4 w-4 text-secondary" />
                        <Badge variant="outline">Recital {recital.id}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{recital.content}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'definitions') && results.definitions.map((def, idx) => (
                <Link key={`def-${idx}`} to="/definitions">
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Book className="h-4 w-4 text-accent-foreground" />
                        <Badge variant="outline">{def.articleReference}</Badge>
                      </div>
                      <h3 className="font-medium">{def.term}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{def.definition}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;

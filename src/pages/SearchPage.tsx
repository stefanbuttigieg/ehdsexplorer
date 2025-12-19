import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, FileText, Scale, Book, Layers, ScrollText, FileStack } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { HighlightedText } from "@/components/HighlightedText";
import { useSearch, getMatchContext } from "@/hooks/useSearch";

type FilterType = 'all' | 'articles' | 'recitals' | 'definitions' | 'chapters' | 'acts' | 'annexes';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>('all');
  
  const { search, isLoading } = useSearch();

  const results = useMemo(() => {
    if (!query.trim()) {
      return { articles: [], recitals: [], definitions: [], chapters: [], implementingActs: [], annexes: [] };
    }
    return search(query);
  }, [query, search]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSearchParams(value ? { q: value } : {});
  };

  const totalResults = results.articles.length + results.recitals.length + results.definitions.length + 
                       results.chapters.length + results.implementingActs.length + results.annexes.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Search" }]} />
        <h1 className="text-3xl font-bold font-serif mb-6">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles, chapters, annexes, implementing acts, recitals, definitions..."
            className="pl-12 py-6 text-lg"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        {isLoading && query && (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        )}

        {query && !isLoading && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-muted-foreground">{totalResults} results</span>
              <div className="flex flex-wrap gap-2 ml-4">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'chapters' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('chapters')}>
                  Chapters ({results.chapters.length})
                </Button>
                <Button variant={filter === 'articles' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('articles')}>
                  Articles ({results.articles.length})
                </Button>
                <Button variant={filter === 'acts' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('acts')}>
                  Impl. Acts ({results.implementingActs.length})
                </Button>
                <Button variant={filter === 'annexes' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('annexes')}>
                  Annexes ({results.annexes.length})
                </Button>
                <Button variant={filter === 'recitals' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('recitals')}>
                  Recitals ({results.recitals.length})
                </Button>
                <Button variant={filter === 'definitions' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('definitions')}>
                  Definitions ({results.definitions.length})
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {(filter === 'all' || filter === 'chapters') && results.chapters.map(result => (
                <Link key={`ch-${result.item.id}`} to={`/chapter/${result.item.chapter_number}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Layers className="h-4 w-4 text-primary" />
                        <Badge variant="outline">Chapter {result.item.chapter_number}</Badge>
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">
                        <HighlightedText text={result.item.title} query={query} />
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <HighlightedText 
                          text={getMatchContext(result.item.description || '', query, 100)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'articles') && results.articles.map(result => (
                <Link key={`art-${result.item.id}`} to={`/article/${result.item.article_number}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <Badge variant="outline">Article {result.item.article_number}</Badge>
                        {result.item.chapter_id && (
                          <span className="text-xs text-muted-foreground">Chapter {result.item.chapter_id}</span>
                        )}
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">
                        <HighlightedText text={result.item.title} query={query} />
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <HighlightedText 
                          text={getMatchContext(result.item.normalizedContent, query, 100)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'acts') && results.implementingActs.map(result => (
                <Link key={`act-${result.item.id}`} to={`/implementing-acts/${result.item.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ScrollText className="h-4 w-4 text-secondary" />
                        <Badge variant="outline">{result.item.articleReference}</Badge>
                        <Badge variant="secondary" className="text-xs">{result.item.type}</Badge>
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">
                        <HighlightedText text={result.item.title} query={query} />
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <HighlightedText 
                          text={getMatchContext(result.item.normalizedDescription, query, 100)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'annexes') && results.annexes.map(result => (
                <Link key={`annex-${result.item.id}`} to={`/annex/${result.item.id}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FileStack className="h-4 w-4 text-primary" />
                        <Badge variant="outline">Annex {result.item.id}</Badge>
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">
                        <HighlightedText text={result.item.title} query={query} />
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <HighlightedText 
                          text={getMatchContext(result.item.normalizedContent, query, 100)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'recitals') && results.recitals.map(result => (
                <Link key={`rec-${result.item.id}`} to={`/recital/${result.item.recital_number}`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="h-4 w-4 text-secondary" />
                        <Badge variant="outline">Recital {result.item.recital_number}</Badge>
                        {result.item.related_articles && result.item.related_articles.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Related: {result.item.related_articles.slice(0, 3).map(a => `Art. ${a}`).join(', ')}
                            {result.item.related_articles.length > 3 && '...'}
                          </span>
                        )}
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        <HighlightedText 
                          text={getMatchContext(result.item.normalizedContent, query, 120)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {(filter === 'all' || filter === 'definitions') && results.definitions.map(result => (
                <Link key={`def-${result.item.id}`} to={`/definitions`}>
                  <Card className="hover:border-primary transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Book className="h-4 w-4 text-accent-foreground" />
                        {result.item.source_article && (
                          <Badge variant="outline">Art. {result.item.source_article}</Badge>
                        )}
                        {result.score !== undefined && (
                          <span className="text-xs text-muted-foreground ml-auto">
                            {Math.round((1 - result.score) * 100)}% match
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium">
                        <HighlightedText text={result.item.term} query={query} />
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        <HighlightedText 
                          text={getMatchContext(result.item.normalizedDefinition, query, 100)} 
                          query={query} 
                        />
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              {totalResults === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try searching for article numbers (e.g., "Article 5"), recitals (e.g., "Recital 10"), 
                    or keywords from the EHDS regulation.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Enter a search term to find articles, chapters, recitals, definitions, implementing acts, and annexes.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tip: You can search by ID (e.g., "Article 5", "Recital 10", "Chapter 3", "Annex I") or by keywords.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchPage;

import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, FileText, Scale, Book } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { articles } from "@/data/articles";
import { recitals } from "@/data/recitals";
import { definitions } from "@/data/definitions";
import Layout from "@/components/Layout";
import Fuse from "fuse.js";

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<'all' | 'articles' | 'recitals' | 'definitions'>('all');

  const fuse = useMemo(() => ({
    articles: new Fuse(articles, { keys: ['title', 'content'], threshold: 0.3 }),
    recitals: new Fuse(recitals, { keys: ['content'], threshold: 0.3 }),
    definitions: new Fuse(definitions, { keys: ['term', 'definition'], threshold: 0.3 }),
  }), []);

  const results = useMemo(() => {
    if (!query.trim()) return { articles: [], recitals: [], definitions: [] };
    return {
      articles: fuse.articles.search(query).map(r => r.item),
      recitals: fuse.recitals.search(query).map(r => r.item),
      definitions: fuse.definitions.search(query).map(r => r.item),
    };
  }, [query, fuse]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSearchParams(value ? { q: value } : {});
  };

  const totalResults = results.articles.length + results.recitals.length + results.definitions.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <h1 className="text-3xl font-bold font-serif mb-6">Search</h1>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search articles, recitals, definitions..."
            className="pl-12 py-6 text-lg"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        {query && (
          <>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-muted-foreground">{totalResults} results</span>
              <div className="flex gap-2 ml-4">
                <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
                <Button variant={filter === 'articles' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('articles')}>Articles ({results.articles.length})</Button>
                <Button variant={filter === 'recitals' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('recitals')}>Recitals ({results.recitals.length})</Button>
                <Button variant={filter === 'definitions' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('definitions')}>Definitions ({results.definitions.length})</Button>
              </div>
            </div>

            <div className="space-y-4">
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

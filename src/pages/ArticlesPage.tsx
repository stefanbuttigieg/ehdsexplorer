import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Star, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useFilteredArticles } from "@/hooks/useArticles";
import { DataExportButtons } from "@/components/DataExportButtons";
import { EliReference } from "@/components/EliReference";
import { HighlightedText } from "@/components/HighlightedText";
import { StakeholderFilterBadge } from "@/components/StakeholderFilter";
import { useStakeholder } from "@/contexts/StakeholderContext";
import Fuse from "fuse.js";

const ArticlesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { 
    articles, 
    allArticles, 
    keyProvisions, 
    isLoading, 
    isFiltered, 
    totalCount, 
    filteredCount 
  } = useFilteredArticles();
  const { activeStakeholder, getStakeholderConfig } = useStakeholder();

  // Create searchable data with normalized content
  const searchableArticles = useMemo(() => {
    if (!articles) return [];
    return articles.map(a => ({
      ...a,
      normalizedContent: a.content.replace(/[#*`_]/g, ' ').replace(/\s+/g, ' ').trim(),
      searchTerms: `article ${a.article_number} art ${a.article_number} art. ${a.article_number}`,
    }));
  }, [articles]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(searchableArticles, {
      keys: [
        { name: 'searchTerms', weight: 2.0 },
        { name: 'title', weight: 1.5 },
        { name: 'normalizedContent', weight: 1.0 },
      ],
      threshold: 0.4,
      distance: 200,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [searchableArticles]);

  // Get filtered results
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchableArticles;
    }

    // Check for direct article number match
    const articleMatch = searchQuery.match(/^(?:article|art\.?)\s*(\d+)$/i);
    if (articleMatch) {
      const num = parseInt(articleMatch[1]);
      const article = searchableArticles.find(a => a.article_number === num);
      return article ? [article] : [];
    }

    // Check for plain number match
    const numMatch = searchQuery.match(/^(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const article = searchableArticles.find(a => a.article_number === num);
      if (article) return [article];
    }

    // Fuzzy search
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, searchableArticles, fuse]);

  const exportData = articles?.map((a) => ({
    article_number: a.article_number,
    title: a.title,
    content: a.content,
    chapter_id: a.chapter_id,
    stakeholder_tags: a.stakeholder_tags,
    is_key_provision: a.is_key_provision,
  })) || [];

  // Get context snippet around the match
  const getMatchContext = (content: string, query: string): string => {
    if (!query.trim()) return content.substring(0, 200);
    
    const normalizedContent = content.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const matchIndex = normalizedContent.indexOf(normalizedQuery);
    
    if (matchIndex === -1) {
      return content.substring(0, 200);
    }

    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, matchIndex + query.length + 150);
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  };

  const stakeholderConfig = activeStakeholder ? getStakeholderConfig(activeStakeholder) : null;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Articles" }]} />
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Articles</h1>
            <p className="text-muted-foreground mb-2">
              {isFiltered ? (
                <>Showing {filteredCount} of {totalCount} articles relevant to {stakeholderConfig?.label}</>
              ) : (
                <>Browse all {totalCount || ''} articles of the EHDS Regulation</>
              )}
            </p>
            <EliReference type="regulation" />
          </div>
          {articles && articles.length > 0 && (
            <DataExportButtons data={exportData} filename="ehds-articles" />
          )}
        </div>

        {/* Active filter badge */}
        {isFiltered && (
          <div className="mb-4">
            <StakeholderFilterBadge />
          </div>
        )}

        {/* Key provisions highlight for filtered view */}
        {isFiltered && keyProvisions.length > 0 && (
          <Alert className="mb-4 border-primary/30 bg-primary/5">
            <Star className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-medium">Key provisions for {stakeholderConfig?.label}:</span>{" "}
              {keyProvisions.slice(0, 5).map((a, idx) => (
                <span key={a.article_number}>
                  <Link to={`/article/${a.article_number}`} className="text-primary hover:underline">
                    Art. {a.article_number}
                  </Link>
                  {idx < Math.min(keyProvisions.length, 5) - 1 && ", "}
                </span>
              ))}
              {keyProvisions.length > 5 && ` and ${keyProvisions.length - 5} more`}
            </AlertDescription>
          </Alert>
        )}

        {/* Search */}
        <div className="relative mb-6 mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by article number (e.g., 'Article 5'), title, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results count when searching */}
        {searchQuery && !isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} 
            {filteredArticles.length > 0 && ` matching "${searchQuery}"`}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card key={article.id} className={article.is_key_provision && isFiltered ? 'border-primary/50' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Link to={`/article/${article.article_number}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        Article {article.article_number}
                      </Badge>
                    </Link>
                    {article.is_key_provision && isFiltered && (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Star className="h-3 w-3" /> Key
                      </Badge>
                    )}
                    {article.chapter_id && (
                      <Link to={`/chapter/${article.chapter_id}`}>
                        <span className="text-xs text-muted-foreground hover:underline">
                          Chapter {article.chapter_id}
                        </span>
                      </Link>
                    )}
                  </div>
                  <Link 
                    to={`/article/${article.article_number}`}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    <HighlightedText text={article.title} query={searchQuery} />
                  </Link>
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                    <HighlightedText 
                      text={getMatchContext(article.normalizedContent, searchQuery)} 
                      query={searchQuery}
                    />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery 
                ? `No articles found matching "${searchQuery}".` 
                : isFiltered 
                  ? `No articles tagged for ${stakeholderConfig?.label}. Try clearing the filter.`
                  : "No articles available."
              }
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Try searching for article numbers (e.g., "Article 5") or keywords like "data", "health", "access".
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ArticlesPage;

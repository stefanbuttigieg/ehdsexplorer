import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useRecitals } from "@/hooks/useRecitals";
import { DataExportButtons } from "@/components/DataExportButtons";
import { EliReference } from "@/components/EliReference";
import { HighlightedText } from "@/components/HighlightedText";
import Fuse from "fuse.js";

const RecitalsPage = () => {
  const { id } = useParams();
  const selectedId = id ? parseInt(id) : null;
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recitals, isLoading } = useRecitals();

  // Create searchable data with normalized content
  const searchableRecitals = useMemo(() => {
    if (!recitals) return [];
    return recitals.map(r => ({
      ...r,
      normalizedContent: r.content.replace(/[#*`_]/g, ' ').replace(/\s+/g, ' ').trim(),
      searchTerms: `recital ${r.recital_number} rec ${r.recital_number} rec. ${r.recital_number}`,
      relatedArticlesText: r.related_articles 
        ? r.related_articles.map(a => `article ${a} art ${a}`).join(' ')
        : '',
    }));
  }, [recitals]);

  // Create Fuse instance for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(searchableRecitals, {
      keys: [
        { name: 'searchTerms', weight: 2.0 },
        { name: 'normalizedContent', weight: 1.0 },
        { name: 'relatedArticlesText', weight: 0.8 },
      ],
      threshold: 0.4,
      distance: 200,
      ignoreLocation: true,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }, [searchableRecitals]);

  // Get filtered results
  const filteredRecitals = useMemo(() => {
    if (!searchQuery.trim()) {
      return searchableRecitals;
    }

    // Check for direct recital number match
    const recitalMatch = searchQuery.match(/^(?:recital|rec\.?)\s*(\d+)$/i);
    if (recitalMatch) {
      const num = parseInt(recitalMatch[1]);
      const recital = searchableRecitals.find(r => r.recital_number === num);
      return recital ? [recital] : [];
    }

    // Check for plain number match
    const numMatch = searchQuery.match(/^(\d+)$/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const recital = searchableRecitals.find(r => r.recital_number === num);
      if (recital) return [recital];
    }

    // Check for article reference search (find recitals related to an article)
    const articleMatch = searchQuery.match(/^(?:article|art\.?)\s*(\d+)$/i);
    if (articleMatch) {
      const articleNum = parseInt(articleMatch[1]);
      return searchableRecitals.filter(r => 
        r.related_articles && r.related_articles.includes(articleNum)
      );
    }

    // Fuzzy search
    return fuse.search(searchQuery).map(result => result.item);
  }, [searchQuery, searchableRecitals, fuse]);

  useEffect(() => {
    if (selectedId && recitals) {
      const element = document.getElementById(`recital-${selectedId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [selectedId, recitals]);

  const breadcrumbItems = selectedId
    ? [{ label: "Recitals", href: "/recitals" }, { label: `Recital ${selectedId}` }]
    : [{ label: "Recitals" }];

  const exportData = recitals?.map((r) => ({
    recital_number: r.recital_number,
    content: r.content,
    related_articles: r.related_articles,
  })) || [];

  // Get context snippet around the match
  const getMatchContext = (content: string, query: string): string => {
    if (!query.trim()) return content;
    
    const normalizedContent = content.toLowerCase();
    const normalizedQuery = query.toLowerCase();
    const matchIndex = normalizedContent.indexOf(normalizedQuery);
    
    if (matchIndex === -1) {
      return content;
    }

    const start = Math.max(0, matchIndex - 80);
    const end = Math.min(content.length, matchIndex + query.length + 200);
    let snippet = content.substring(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">
              {selectedId ? `Recital ${selectedId}` : "Recitals"}
            </h1>
            <p className="text-muted-foreground mb-2">
              {selectedId 
                ? "Context and interpretation guidance" 
                : `The ${recitals?.length || ''} recitals providing context and interpretation guidance`}
            </p>
            <EliReference type="regulation" />
          </div>
          {!selectedId && recitals && recitals.length > 0 && (
            <DataExportButtons data={exportData} filename="ehds-recitals" />
          )}
        </div>

        {/* Search */}
        {!selectedId && (
          <div className="relative mb-6 mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by recital number (e.g., 'Recital 10'), content, or related article (e.g., 'Article 5')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Results count when searching */}
        {searchQuery && !isLoading && !selectedId && (
          <p className="text-sm text-muted-foreground mb-4">
            Found {filteredRecitals.length} recital{filteredRecitals.length !== 1 ? 's' : ''} 
            {filteredRecitals.length > 0 && ` matching "${searchQuery}"`}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-24 mb-3" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredRecitals && filteredRecitals.length > 0 ? (
          <div className="space-y-4">
            {filteredRecitals.map((recital) => (
              <Card 
                key={recital.id} 
                id={`recital-${recital.recital_number}`} 
                className={selectedId === recital.recital_number ? 'border-primary' : ''}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Link to={`/recital/${recital.recital_number}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        Recital {recital.recital_number}
                      </Badge>
                    </Link>
                    {recital.related_articles && recital.related_articles.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Related: {recital.related_articles.map((a: number, idx: number) => (
                          <span key={a}>
                            <Link to={`/article/${a}`} className="hover:underline hover:text-primary">
                              Art. {a}
                            </Link>
                            {idx < recital.related_articles!.length - 1 && ', '}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground legal-text">
                    {searchQuery ? (
                      <HighlightedText 
                        text={getMatchContext(recital.normalizedContent, searchQuery)} 
                        query={searchQuery}
                      />
                    ) : (
                      recital.content
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchQuery ? `No recitals found matching "${searchQuery}".` : "No recitals available."}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2">
                Try searching for recital numbers (e.g., "Recital 10"), keywords, or related articles (e.g., "Article 5").
              </p>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RecitalsPage;

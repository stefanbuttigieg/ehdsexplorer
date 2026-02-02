import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDefinitions, searchDefinitions, getSourceLabel, type DefinitionSource } from "@/hooks/useDefinitions";
import { useAllDefinitionSources, groupSourcesByDefinition } from "@/hooks/useDefinitionSources";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataExportButtons } from "@/components/DataExportButtons";

const DefinitionsPage = () => {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<DefinitionSource | 'all'>('all');
  const [expandedDefs, setExpandedDefs] = useState<Set<number>>(new Set());
  const { data: definitions = [], isLoading } = useDefinitions();
  const { data: allSources = [] } = useAllDefinitionSources();
  
  const sourcesByDefinition = groupSourcesByDefinition(allSources);
  
  const filteredDefs = (() => {
    let defs = definitions;
    if (sourceFilter !== 'all') {
      // Filter definitions that have the selected source
      defs = defs.filter(d => {
        const sources = sourcesByDefinition[d.id] || [];
        return sources.some(s => s.source === sourceFilter);
      });
    }
    if (query) {
      defs = searchDefinitions(defs, query);
    }
    return defs;
  })();

  const toggleExpanded = (defId: number) => {
    setExpandedDefs(prev => {
      const next = new Set(prev);
      if (next.has(defId)) {
        next.delete(defId);
      } else {
        next.add(defId);
      }
      return next;
    });
  };

  const exportData = definitions.map((d) => ({
    term: d.term,
    definition: d.definition,
    source_article: d.source_article,
    source: d.source,
  }));

  // Count definitions by source from the sources table
  const definitionsWithSource = (source: DefinitionSource) => {
    return new Set(allSources.filter(s => s.source === source).map(s => s.definition_id)).size;
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Definitions" }]} />
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold font-serif mb-2">Definitions</h1>
            <p className="text-muted-foreground">Official EHDS terminology and definitions</p>
          </div>
          {definitions.length > 0 && (
            <DataExportButtons data={exportData} filename="ehds-definitions" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search definitions..."
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge 
              variant={sourceFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('all')}
            >
              All ({definitions.length})
            </Badge>
            <Badge 
              variant={sourceFilter === 'ehds_regulation' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('ehds_regulation')}
            >
              Regulation ({definitionsWithSource('ehds_regulation')})
            </Badge>
            <Badge 
              variant={sourceFilter === 'eu_ehr_glossary' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('eu_ehr_glossary')}
            >
              EU EHR ({definitionsWithSource('eu_ehr_glossary')})
            </Badge>
            <Badge 
              variant={sourceFilter === 'xt_ehr' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('xt_ehr')}
            >
              Xt-EHR ({definitionsWithSource('xt_ehr')})
            </Badge>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-1" />
                </CardContent>
              </Card>
            ))
          ) : filteredDefs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {query ? "No definitions match your search." : "No definitions found."}
            </p>
          ) : (
            filteredDefs.map((def) => {
              const sources = sourcesByDefinition[def.id] || [];
              const hasMultipleSources = sources.length > 1;
              const isExpanded = expandedDefs.has(def.id);
              const primarySource = sources[0];
              
              return (
                <Card key={def.id} id={def.term.toLowerCase().replace(/\s+/g, '-')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{def.term}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                        {sources.map(src => (
                          <Badge key={src.id} variant="secondary" className="text-xs">
                            {getSourceLabel(src.source)}
                            {src.source_article && (
                              <Link to={`/article/${src.source_article}`} className="ml-1 hover:underline">
                                (Art. {src.source_article})
                              </Link>
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {hasMultipleSources ? (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(def.id)}>
                        <p className="text-muted-foreground legal-text">
                          {primarySource?.source_text || def.definition}
                        </p>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="mt-2 text-xs">
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide other sources
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show {sources.length - 1} other source{sources.length > 2 ? 's' : ''}
                              </>
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3 space-y-3">
                          {sources.slice(1).map(src => (
                            <div key={src.id} className="pl-4 border-l-2 border-muted">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {getSourceLabel(src.source)}
                                </Badge>
                                {src.source_article && (
                                  <Link to={`/article/${src.source_article}`}>
                                    <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Article {src.source_article}
                                    </Badge>
                                  </Link>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{src.source_text}</p>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    ) : (
                      <p className="text-muted-foreground legal-text">
                        {primarySource?.source_text || def.definition}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DefinitionsPage;

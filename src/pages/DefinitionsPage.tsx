import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDefinitions, searchDefinitions, getSourceLabel, type DefinitionSource } from "@/hooks/useDefinitions";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataExportButtons } from "@/components/DataExportButtons";

const DefinitionsPage = () => {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<DefinitionSource | 'all'>('all');
  const { data: definitions = [], isLoading } = useDefinitions();
  
  const filteredDefs = (() => {
    let defs = definitions;
    if (sourceFilter !== 'all') {
      defs = defs.filter(d => d.source === sourceFilter);
    }
    if (query) {
      defs = searchDefinitions(defs, query);
    }
    return defs;
  })();

  const exportData = definitions.map((d) => ({
    term: d.term,
    definition: d.definition,
    source_article: d.source_article,
    source: d.source,
  }));

  // Count definitions by source
  const sourceCounts = definitions.reduce((acc, def) => {
    const source = def.source || 'ehds_regulation';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              Regulation ({sourceCounts['ehds_regulation'] || 0})
            </Badge>
            <Badge 
              variant={sourceFilter === 'eu_ehr_glossary' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('eu_ehr_glossary')}
            >
              EU EHR ({sourceCounts['eu_ehr_glossary'] || 0})
            </Badge>
            <Badge 
              variant={sourceFilter === 'xt_ehr' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSourceFilter('xt_ehr')}
            >
              Xt-EHR ({sourceCounts['xt_ehr'] || 0})
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
            filteredDefs.map((def) => (
              <Card key={def.id} id={def.term.toLowerCase().replace(/\s+/g, '-')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{def.term}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {def.source_article && (
                        <Link to={`/article/${def.source_article}`}>
                          <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                            <FileText className="h-3 w-3 mr-1" />
                            Article {def.source_article}
                          </Badge>
                        </Link>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {getSourceLabel(def.source)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground legal-text">{def.definition}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DefinitionsPage;

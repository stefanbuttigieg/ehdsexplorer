import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ExternalLink, BookOpen, Users, Building2, Stethoscope, FileText, Book } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import TopicIndexTable from "@/components/TopicIndexTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useDefinitions, searchDefinitions, getSourceLabel, type DefinitionSource } from "@/hooks/useDefinitions";

const TopicIndexPage = () => {
  const [activeTab, setActiveTab] = useState("glossary");
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<DefinitionSource | 'all'>('all');
  
  const { data: definitions = [], isLoading: definitionsLoading } = useDefinitions();
  
  const filteredDefinitions = (() => {
    let defs = definitions;
    if (sourceFilter !== 'all') {
      defs = defs.filter(d => d.source === sourceFilter);
    }
    if (glossaryQuery) {
      defs = searchDefinitions(defs, glossaryQuery);
    }
    return defs;
  })();

  // Group definitions by first letter
  const groupedDefinitions = filteredDefinitions.reduce((acc, def) => {
    const letter = def.term.charAt(0).toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(def);
    return acc;
  }, {} as Record<string, typeof filteredDefinitions>);

  const sortedLetters = Object.keys(groupedDefinitions).sort();

  // Count definitions by source
  const sourceCounts = definitions.reduce((acc, def) => {
    const source = def.source || 'ehds_regulation';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Topics & Glossary" }]} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif mb-2">Topics & Glossary</h1>
          <p className="text-muted-foreground text-lg">
            Explore EHDS terminology and find articles by topic, right, or obligation.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="glossary" className="gap-2">
              <Book className="h-4 w-4" />
              <span className="hidden sm:inline">Glossary</span>
            </TabsTrigger>
            <TabsTrigger value="citizen" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Citizens</span>
            </TabsTrigger>
            <TabsTrigger value="healthtech" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Health Tech</span>
            </TabsTrigger>
            <TabsTrigger value="healthcare_professional" className="gap-2">
              <Stethoscope className="h-4 w-4" />
              <span className="hidden sm:inline">Healthcare Pros</span>
            </TabsTrigger>
          </TabsList>

          {/* Glossary Tab */}
          <TabsContent value="glossary" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Comprehensive glossary of EHDS terminology, combining official regulation definitions with 
                the EU EHR Database glossary for complete coverage of primary use concepts.
              </p>
            </div>

            {/* Source Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search terms and definitions..."
                  className="pl-10"
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
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
                  EHDS Regulation ({sourceCounts['ehds_regulation'] || 0})
                </Badge>
                <Badge 
                  variant={sourceFilter === 'eu_ehr_glossary' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSourceFilter('eu_ehr_glossary')}
                >
                  EU EHR Database ({sourceCounts['eu_ehr_glossary'] || 0})
                </Badge>
              </div>
            </div>

            {/* Alphabet Quick Nav */}
            {!definitionsLoading && sortedLetters.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {sortedLetters.map(letter => (
                  <a
                    key={letter}
                    href={`#letter-${letter}`}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-sm font-medium"
                  >
                    {letter}
                  </a>
                ))}
              </div>
            )}

            {/* Definitions List */}
            <div className="space-y-6">
              {definitionsLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <Card key={idx}>
                    <CardContent className="p-5">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4 mt-1" />
                    </CardContent>
                  </Card>
                ))
              ) : filteredDefinitions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  {glossaryQuery ? "No definitions match your search." : "No definitions found."}
                </p>
              ) : (
                sortedLetters.map(letter => (
                  <div key={letter} id={`letter-${letter}`}>
                    <h3 className="text-xl font-bold text-primary mb-3 sticky top-0 bg-background py-2 border-b">
                      {letter}
                    </h3>
                    <div className="space-y-3">
                      {groupedDefinitions[letter].map((def) => (
                        <Card key={def.id} id={def.term.toLowerCase().replace(/\s+/g, '-')}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{def.term}</h4>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {def.source_article && (
                                  <Link to={`/article/${def.source_article}`}>
                                    <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                                      <FileText className="h-3 w-3 mr-1" />
                                      Art. {def.source_article}
                                    </Badge>
                                  </Link>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {getSourceLabel(def.source)}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-muted-foreground text-sm">{def.definition}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* External Resources */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg">Additional Resources</CardTitle>
                <CardDescription>
                  External glossaries and terminology resources for EHDS implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <a 
                  href="https://acceptance.data.health.europa.eu/ehr-systems/glossary" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">EU EHR Systems Database Glossary</p>
                    <p className="text-sm text-muted-foreground">
                      Official glossary from the European Commission EHR systems registry
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <a 
                  href="https://www.xt-ehr.eu/glossary-list/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">Xt-EHR Glossary</p>
                    <p className="text-sm text-muted-foreground">
                      Comprehensive glossary covering primary use terms, EHR systems, and interoperability
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
                <Link 
                  to="/definitions" 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">EHDS Article 2 Definitions</p>
                    <p className="text-sm text-muted-foreground">
                      Official legal definitions from the EHDS Regulation text
                    </p>
                  </div>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Citizens Tab */}
          <TabsContent value="citizen" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Rights and provisions relevant to EU citizens regarding their personal health data, 
                including access, control, and cross-border portability.
              </p>
            </div>
            <TopicIndexTable stakeholderType="citizen" />
          </TabsContent>

          {/* Health Tech Tab */}
          <TabsContent value="healthtech" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Requirements and obligations for EHR system manufacturers, wellness app developers, 
                and health data platforms operating in the EU market.
              </p>
            </div>
            <TopicIndexTable stakeholderType="healthtech" />
          </TabsContent>

          {/* Healthcare Professionals Tab */}
          <TabsContent value="healthcare_professional" className="space-y-6">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
              <p className="text-muted-foreground">
                Obligations and guidance for healthcare providers, hospitals, and clinicians 
                regarding health data management and patient rights support.
              </p>
            </div>
            <TopicIndexTable stakeholderType="healthcare_professional" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TopicIndexPage;
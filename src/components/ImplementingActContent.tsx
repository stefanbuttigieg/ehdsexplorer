import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, FileText, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useImplementingActRecitals,
  useImplementingActSections,
  useImplementingActArticles,
  groupArticlesBySection,
} from "@/hooks/useImplementingActContent";
import ReactMarkdown from "react-markdown";

interface ImplementingActContentProps {
  implementingActId: string;
}

const ImplementingActContent = ({ implementingActId }: ImplementingActContentProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: recitals = [], isLoading: loadingRecitals } = useImplementingActRecitals(implementingActId);
  const { data: sections = [], isLoading: loadingSections } = useImplementingActSections(implementingActId);
  const { data: articles = [], isLoading: loadingArticles } = useImplementingActArticles(implementingActId);

  const isLoading = loadingRecitals || loadingSections || loadingArticles;

  // Filter content based on search
  const filteredRecitals = useMemo(() => {
    if (!searchQuery) return recitals;
    const query = searchQuery.toLowerCase();
    return recitals.filter(
      (r) =>
        r.content.toLowerCase().includes(query) ||
        r.recital_number.toString().includes(query)
    );
  }, [recitals, searchQuery]);

  const filteredArticles = useMemo(() => {
    if (!searchQuery) return articles;
    const query = searchQuery.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query) ||
        a.article_number.toString().includes(query)
    );
  }, [articles, searchQuery]);

  const { ungroupedArticles, sectionGroups } = useMemo(
    () => groupArticlesBySection(filteredArticles, sections),
    [filteredArticles, sections]
  );

  const hasContent = recitals.length > 0 || articles.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No articles or recitals have been added for this implementing act yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Act Content</CardTitle>
          <Badge variant="outline">
            {articles.length} Articles · {recitals.length} Recitals
          </Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles and recitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="articles">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles" className="gap-2">
              <FileText className="h-4 w-4" />
              Articles ({filteredArticles.length})
            </TabsTrigger>
            <TabsTrigger value="recitals" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Recitals ({filteredRecitals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {filteredArticles.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No articles match your search" : "No articles added yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Articles with sections */}
                  {sectionGroups.map(({ section, articles: sectionArticles }) =>
                    sectionArticles.length > 0 ? (
                      <div key={section.id} className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                          Section {section.section_number}: {section.title}
                        </h3>
                        <Accordion type="single" collapsible className="space-y-2">
                          {sectionArticles.map((article) => (
                            <AccordionItem
                              key={article.id}
                              value={article.id}
                              className="border rounded-lg"
                            >
                              <AccordionTrigger className="px-4 hover:no-underline">
                                <div className="flex items-center gap-3 text-left">
                                  <Badge variant="secondary" className="shrink-0">
                                    Art. {article.article_number}
                                  </Badge>
                                  <span className="font-medium">{article.title}</span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                <div className="prose prose-sm dark:prose-invert max-w-none legal-text">
                                  <ReactMarkdown>{article.content}</ReactMarkdown>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ) : null
                  )}

                  {/* Ungrouped articles */}
                  {ungroupedArticles.length > 0 && (
                    <Accordion type="single" collapsible className="space-y-2">
                      {ungroupedArticles.map((article) => (
                        <AccordionItem
                          key={article.id}
                          value={article.id}
                          className="border rounded-lg"
                        >
                          <AccordionTrigger className="px-4 hover:no-underline">
                            <div className="flex items-center gap-3 text-left">
                              <Badge variant="secondary" className="shrink-0">
                                Art. {article.article_number}
                              </Badge>
                              <span className="font-medium">{article.title}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none legal-text">
                              <ReactMarkdown>{article.content}</ReactMarkdown>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="recitals" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              {filteredRecitals.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {searchQuery ? "No recitals match your search" : "No recitals added yet"}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredRecitals.map((recital) => (
                    <div
                      key={recital.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0">
                          ({recital.recital_number})
                        </Badge>
                        <div className="prose prose-sm dark:prose-invert max-w-none legal-text">
                          <ReactMarkdown>{recital.content}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ImplementingActContent;

import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  X,
  FileText,
  ScrollText,
  Scale,
  Plus,
  GitCompare,
} from "lucide-react";
import { useComparison, ComparisonItem, ComparisonItemType } from "@/hooks/useComparison";
import { useArticles, Article } from "@/hooks/useArticles";
import { useRecitals, Recital } from "@/hooks/useRecitals";
import { useImplementingActs, ImplementingAct } from "@/hooks/useImplementingActs";
import { AnnotatedContent } from "@/components/AnnotatedContent";
import ReactMarkdown from "react-markdown";

const typeIcons: Record<ComparisonItemType, React.ElementType> = {
  article: FileText,
  recital: ScrollText,
  "implementing-act": Scale,
};

const typeBadgeColors: Record<ComparisonItemType, string> = {
  article: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  recital: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "implementing-act": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

interface ContentData {
  title: string;
  content: string;
  number?: number;
  link: string;
  metadata?: Record<string, string>;
}

const ComparePage = () => {
  const navigate = useNavigate();
  const { items, removeItem, addItem, clearItems, canAddMore } = useComparison();
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: recitals = [], isLoading: recitalsLoading } = useRecitals();
  const { data: implementingActs = [], isLoading: actsLoading } = useImplementingActs();

  const [addingType, setAddingType] = useState<ComparisonItemType | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  const isLoading = articlesLoading || recitalsLoading || actsLoading;

  // Get content data for each comparison item
  const contentData = useMemo((): Map<string, ContentData | null> => {
    const map = new Map<string, ContentData | null>();

    items.forEach((item) => {
      const key = `${item.type}-${item.id}`;
      
      if (item.type === "article") {
        const article = articles.find((a) => a.article_number.toString() === item.id);
        if (article) {
          map.set(key, {
            title: article.title,
            content: article.content,
            number: article.article_number,
            link: `/article/${article.article_number}`,
          });
        } else {
          map.set(key, null);
        }
      } else if (item.type === "recital") {
        const recital = recitals.find((r) => r.recital_number.toString() === item.id);
        if (recital) {
          map.set(key, {
            title: `Recital (${recital.recital_number})`,
            content: recital.content,
            number: recital.recital_number,
            link: `/recital/${recital.recital_number}`,
          });
        } else {
          map.set(key, null);
        }
      } else if (item.type === "implementing-act") {
        const act = implementingActs.find((a) => a.id === item.id);
        if (act) {
          map.set(key, {
            title: act.title,
            content: act.description,
            link: `/implementing-acts/${act.id}`,
            metadata: {
              Reference: act.articleReference,
              Status: act.status.charAt(0).toUpperCase() + act.status.slice(1),
              Type: act.type.charAt(0).toUpperCase() + act.type.slice(1),
            },
          });
        } else {
          map.set(key, null);
        }
      }
    });

    return map;
  }, [items, articles, recitals, implementingActs]);

  // Options for adding items
  const addOptions = useMemo(() => {
    if (!addingType) return [];

    const existingIds = items
      .filter((i) => i.type === addingType)
      .map((i) => i.id);

    if (addingType === "article") {
      return articles
        .filter((a) => !existingIds.includes(a.article_number.toString()))
        .map((a) => ({
          id: a.article_number.toString(),
          label: `Article ${a.article_number}: ${a.title}`,
        }));
    } else if (addingType === "recital") {
      return recitals
        .filter((r) => !existingIds.includes(r.recital_number.toString()))
        .map((r) => ({
          id: r.recital_number.toString(),
          label: `Recital (${r.recital_number})`,
        }));
    } else if (addingType === "implementing-act") {
      return implementingActs
        .filter((a) => !existingIds.includes(a.id))
        .map((a) => ({
          id: a.id,
          label: `${a.articleReference}: ${a.title}`,
        }));
    }
    return [];
  }, [addingType, items, articles, recitals, implementingActs]);

  const handleAddItem = () => {
    if (!addingType || !selectedId) return;

    let title = "";
    let number: number | undefined;

    if (addingType === "article") {
      const article = articles.find((a) => a.article_number.toString() === selectedId);
      title = article ? `Article ${article.article_number}` : "";
      number = article?.article_number;
    } else if (addingType === "recital") {
      const recital = recitals.find((r) => r.recital_number.toString() === selectedId);
      title = recital ? `Recital ${recital.recital_number}` : "";
      number = recital?.recital_number;
    } else if (addingType === "implementing-act") {
      const act = implementingActs.find((a) => a.id === selectedId);
      title = act?.title || "";
    }

    addItem({ id: selectedId, type: addingType, title, number });
    setAddingType(null);
    setSelectedId("");
  };

  // Grid columns based on item count
  const gridCols = items.length <= 2 ? "md:grid-cols-2" : items.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GitCompare className="h-6 w-6" />
              Compare Content
            </h1>
            <p className="text-muted-foreground">
              Side-by-side comparison of articles, recitals, and implementing acts
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" onClick={clearItems}>
              Clear All
            </Button>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No items to compare</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Add articles, recitals, or implementing acts to compare them side by side.
                You can add up to 4 items.
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button variant="outline" asChild>
                  <Link to="/articles">
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Articles
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/recitals">
                    <ScrollText className="h-4 w-4 mr-2" />
                    Browse Recitals
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/implementing-acts">
                    <Scale className="h-4 w-4 mr-2" />
                    Browse Acts
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add item controls */}
        {items.length > 0 && canAddMore && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium">Add to comparison:</span>
                
                {!addingType ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingType("article")}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Article
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingType("recital")}
                    >
                      <ScrollText className="h-4 w-4 mr-1" />
                      Recital
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAddingType("implementing-act")}
                    >
                      <Scale className="h-4 w-4 mr-1" />
                      Implementing Act
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Select value={selectedId} onValueChange={setSelectedId}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder={`Select ${addingType.replace("-", " ")}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {addOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id}>
                            <span className="truncate">{opt.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      disabled={!selectedId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAddingType(null);
                        setSelectedId("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison grid */}
        {items.length > 0 && (
          <div className={`grid gap-4 ${gridCols}`}>
            {items.map((item) => {
              const key = `${item.type}-${item.id}`;
              const data = contentData.get(key);
              const Icon = typeIcons[item.type];

              return (
                <Card key={key} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <Badge className={`${typeBadgeColors[item.type]} mb-2`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {item.type === "implementing-act"
                            ? "Implementing Act"
                            : item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </Badge>
                        {isLoading ? (
                          <Skeleton className="h-6 w-3/4" />
                        ) : (
                          <CardTitle className="text-lg leading-tight">
                            {data?.number !== undefined && (
                              <span className="text-primary mr-1">
                                {item.type === "article" ? `Article ${data.number}:` : `(${data.number})`}
                              </span>
                            )}
                            {data?.title || item.title}
                          </CardTitle>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0 h-8 w-8"
                        onClick={() => removeItem(item.id, item.type)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Metadata for implementing acts */}
                    {data?.metadata && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(data.metadata).map(([key, value]) => (
                          <span key={key} className="text-xs text-muted-foreground">
                            <span className="font-medium">{key}:</span> {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 pt-0">
                    <ScrollArea className="h-[400px] pr-4">
                      {isLoading ? (
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-5/6" />
                          <Skeleton className="h-4 w-4/6" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      ) : data ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{data.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">
                          Content not found
                        </p>
                      )}
                    </ScrollArea>
                  </CardContent>
                  
                  {data && (
                    <div className="p-4 pt-0">
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={data.link}>View Full {item.type === "implementing-act" ? "Act" : item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Link>
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Minimum items notice */}
        {items.length === 1 && (
          <p className="text-center text-muted-foreground mt-6">
            Add at least one more item to start comparing.
          </p>
        )}
      </div>
    </Layout>
  );
};

export default ComparePage;

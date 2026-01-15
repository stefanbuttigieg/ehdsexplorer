import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getArticleById } from "@/data/articles";
import Layout from "@/components/Layout";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import PrintButton from "@/components/PrintButton";
import { useRecital, useRecitals } from "@/hooks/useRecitals";
import { useFootnotesByRecital } from "@/hooks/useFootnotes";
import FootnotesSection from "@/components/FootnotesSection";
import { JsonLdMetadata } from "@/components/JsonLdMetadata";
import { EliReference } from "@/components/EliReference";
import PlainLanguageView from "@/components/PlainLanguageView";
import { AnnotatedContent } from "@/components/AnnotatedContent";
import { CompareButton } from "@/components/CompareButton";

const RecitalPage = () => {
  const { id } = useParams();
  const recitalNumber = parseInt(id || "1");
  const { data: recital, isLoading } = useRecital(recitalNumber);
  const { data: recitals = [] } = useRecitals();
  const { data: footnotes = [] } = useFootnotesByRecital(recital?.id ?? null);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useKeyboardShortcuts({
    onBookmark: () => recital && toggleBookmark('recital', recitalNumber),
  });

  const prevRecital = recitals.find(r => r.recital_number === recitalNumber - 1);
  const nextRecital = recitals.find(r => r.recital_number === recitalNumber + 1);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!recital) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Recital not found</h1>
          <Link to="/recitals"><Button>View all recitals</Button></Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbItems = [
    { label: "Recitals", href: "/recitals" },
    { label: `Recital ${recital.recital_number}` }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <JsonLdMetadata
          type="recital"
          recitalNumber={recital.recital_number}
          content={recital.content}
        />
        <Breadcrumbs items={breadcrumbItems} />

        {/* Recital Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Badge variant="outline" className="mb-2">Recital {recital.recital_number}</Badge>
            <h1 className="text-3xl font-bold font-serif">Recital {recital.recital_number}</h1>
            <p className="text-muted-foreground mt-1">Context and interpretation guidance</p>
            <div className="mt-2">
              <EliReference type="recital" number={recital.recital_number} />
            </div>
          </div>
          <div className="flex gap-2">
            <CompareButton
              item={{
                id: recitalNumber.toString(),
                type: "recital",
                title: `Recital ${recital.recital_number}`,
                number: recital.recital_number,
              }}
            />
            <PrintButton />
            <Button
              variant={isBookmarked('recital', recitalNumber) ? "default" : "outline"}
              size="icon"
              onClick={() => toggleBookmark('recital', recitalNumber)}
            >
              <Bookmark className={isBookmarked('recital', recitalNumber) ? "fill-current" : ""} />
            </Button>
          </div>
        </div>

        {/* Recital Content with Plain Language View */}
        <PlainLanguageView
          contentType="recital"
          contentId={recitalNumber}
          originalContent={
            <Card className="mb-8">
              <CardContent className="p-6">
                <AnnotatedContent
                  content={recital.content}
                  contentType="recital"
                  contentId={recitalNumber.toString()}
                  className="legal-text text-lg leading-relaxed"
                />
                <FootnotesSection footnotes={footnotes} />
              </CardContent>
            </Card>
          }
        />

        {/* Related Articles */}
        {recital.related_articles && recital.related_articles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Related Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recital.related_articles.map((articleId) => {
                const article = getArticleById(articleId);
                return article ? (
                  <Link key={articleId} to={`/article/${articleId}`} className="block">
                    <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                      <span className="font-medium">Article {articleId}</span>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{article.title}</p>
                    </div>
                  </Link>
                ) : null;
              })}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          {prevRecital ? (
            <Link to={`/recital/${prevRecital.recital_number}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Recital {prevRecital.recital_number}
              </Button>
            </Link>
          ) : <div />}
          {nextRecital && (
            <Link to={`/recital/${nextRecital.recital_number}`}>
              <Button variant="outline" className="gap-2">
                Recital {nextRecital.recital_number}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default RecitalPage;

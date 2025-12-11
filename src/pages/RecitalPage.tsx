import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRecitalById, recitals } from "@/data/recitals";
import { getArticleById } from "@/data/articles";
import Layout from "@/components/Layout";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import PrintButton from "@/components/PrintButton";

const RecitalPage = () => {
  const { id } = useParams();
  const recitalId = parseInt(id || "1");
  const recital = getRecitalById(recitalId);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useKeyboardShortcuts({
    onBookmark: () => recital && toggleBookmark('recital', recitalId),
  });

  const prevRecital = recitals.find(r => r.id === recitalId - 1);
  const nextRecital = recitals.find(r => r.id === recitalId + 1);

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
    { label: `Recital ${recital.id}` }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Recital Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-2">Recital {recital.id}</Badge>
            <h1 className="text-3xl font-bold font-serif">Recital {recital.id}</h1>
            <p className="text-muted-foreground mt-1">Context and interpretation guidance</p>
          </div>
          <div className="flex gap-2">
            <PrintButton />
            <Button
              variant={isBookmarked('recital', recitalId) ? "default" : "outline"}
              size="icon"
              onClick={() => toggleBookmark('recital', recitalId)}
            >
              <Bookmark className={isBookmarked('recital', recitalId) ? "fill-current" : ""} />
            </Button>
          </div>
        </div>

        {/* Recital Content */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="legal-text whitespace-pre-wrap text-lg leading-relaxed">
              {recital.content}
            </div>
          </CardContent>
        </Card>

        {/* Related Articles */}
        {recital.relatedArticles.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Related Articles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recital.relatedArticles.map((articleId) => {
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
            <Link to={`/recital/${prevRecital.id}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Recital {prevRecital.id}
              </Button>
            </Link>
          ) : <div />}
          {nextRecital && (
            <Link to={`/recital/${nextRecital.id}`}>
              <Button variant="outline" className="gap-2">
                Recital {nextRecital.id}
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

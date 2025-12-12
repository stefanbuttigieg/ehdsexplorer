import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useArticle, useArticles } from "@/hooks/useArticles";
import { getChapterByArticle } from "@/data/chapters";
import { getRecitalsByArticle } from "@/data/recitals";
import { useImplementingActs, getActsByArticle, statusLabels } from "@/hooks/useImplementingActs";
import Layout from "@/components/Layout";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import PrintButton from "@/components/PrintButton";

const ArticlePage = () => {
  const { id } = useParams();
  const articleId = parseInt(id || "1");
  const { data: article, isLoading } = useArticle(articleId);
  const { data: articles } = useArticles();
  const { data: implementingActs = [] } = useImplementingActs();
  const chapter = getChapterByArticle(articleId);
  const relatedRecitals = getRecitalsByArticle(articleId);
  const relatedActs = getActsByArticle(implementingActs, articleId);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { markAsRead } = useReadingProgress();

  useKeyboardShortcuts({
    onBookmark: () => article && toggleBookmark('article', articleId),
  });

  useEffect(() => {
    if (article) {
      markAsRead(articleId);
    }
  }, [articleId, article, markAsRead]);

  const prevArticle = articles?.find(a => a.article_number === articleId - 1);
  const nextArticle = articles?.find(a => a.article_number === articleId + 1);

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

  if (!article) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <Link to="/"><Button>Return home</Button></Link>
        </div>
      </Layout>
    );
  }

  const breadcrumbItems = chapter
    ? [{ label: `Chapter ${chapter.id}`, href: `/chapter/${chapter.id}` }, { label: `Article ${article.article_number}` }]
    : [{ label: `Article ${article.article_number}` }];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={breadcrumbItems} />

        {/* Article Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <Badge variant="outline" className="mb-2">Article {article.article_number}</Badge>
            <h1 className="text-3xl font-bold font-serif">{article.title}</h1>
          </div>
          <div className="flex gap-2">
            <PrintButton />
            <Button
              variant={isBookmarked('article', articleId) ? "default" : "outline"}
              size="icon"
              onClick={() => toggleBookmark('article', articleId)}
            >
              <Bookmark className={isBookmarked('article', articleId) ? "fill-current" : ""} />
            </Button>
          </div>
        </div>

        {/* Article Content */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="article-content whitespace-pre-wrap">
              {article.content}
            </div>
          </CardContent>
        </Card>

        {/* Related Recitals */}
        {relatedRecitals.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Related Recitals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedRecitals.slice(0, 3).map((recital) => (
                <Link key={recital.id} to={`/recital/${recital.id}`} className="block">
                  <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                    <span className="font-medium">Recital {recital.id}</span>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{recital.content}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Related Implementing Acts */}
        {relatedActs.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Implementing Acts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedActs.map((act) => (
                <Link key={act.id} to={`/implementing-acts/${act.id}`} className="block">
                  <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors flex items-center justify-between">
                    <div>
                      <span className="font-medium">{act.articleReference}</span>
                      <p className="text-sm text-muted-foreground">{act.title}</p>
                    </div>
                    <Badge className={`status-${act.status}`}>{statusLabels[act.status]}</Badge>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t border-border">
          {prevArticle ? (
            <Link to={`/article/${prevArticle.article_number}`}>
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" />
                Art. {prevArticle.article_number}
              </Button>
            </Link>
          ) : <div />}
          {nextArticle && (
            <Link to={`/article/${nextArticle.article_number}`}>
              <Button variant="outline" className="gap-2">
                Art. {nextArticle.article_number}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ArticlePage;

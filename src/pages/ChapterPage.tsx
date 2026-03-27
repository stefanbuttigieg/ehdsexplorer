import { useParams, Link } from "react-router-dom";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useChapter } from "@/hooks/useChapters";
import { useSectionsByChapter } from "@/hooks/useSections";
import { useArticles } from "@/hooks/useArticles";
import Layout from "@/components/Layout";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import PrintButton from "@/components/PrintButton";

const ChapterPage = () => {
  const { id } = useParams();
  const chapterId = parseInt(id || "1");
  const { data: chapter, isLoading: chapterLoading } = useChapter(chapterId);
  const { data: sections } = useSectionsByChapter(chapterId);
  const { data: articles, isLoading: articlesLoading } = useArticles();
  const { isRead, getChapterProgress } = useReadingProgress();

  const isLoading = chapterLoading || articlesLoading;

  if (!isLoading && !chapter) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Chapter not found</h1>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Filter articles by chapter_id from the database
  const chapterArticles = articles?.filter(
    (a) => a.chapter_id === chapterId
  ).sort((a, b) => a.article_number - b.article_number) || [];

  // Compute article range for reading progress
  const articleNumbers = chapterArticles.map(a => a.article_number);
  const articleRange: [number, number] = articleNumbers.length > 0
    ? [Math.min(...articleNumbers), Math.max(...articleNumbers)]
    : [0, 0];

  const hasSections = sections && sections.length > 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: `Chapter ${chapter!.chapter_number}` }]} />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Badge variant="outline" className="mb-2">Chapter {chapter!.chapter_number}</Badge>
            <h1 className="text-3xl font-bold font-serif">{chapter!.title}</h1>
          </div>
          <PrintButton />
        </div>
        {chapter!.description && (
          <p className="text-muted-foreground mb-4">{chapter!.description}</p>
        )}
        
        {/* Reading Progress */}
        {(() => {
          const progress = getChapterProgress(articleRange);
          return (
            <div className="mb-8 p-4 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Reading Progress</span>
                <span className="text-sm text-muted-foreground">
                  {progress.read}/{progress.total} articles ({progress.percentage}%)
                </span>
              </div>
              <Progress value={progress.percentage} className="h-2" />
            </div>
          );
        })()}

        {hasSections ? (
          sections.map((section) => {
            const sectionArticles = chapterArticles.filter(
              (a) => a.section_id === section.id
            );
            if (sectionArticles.length === 0) return null;
            return (
              <div key={section.id} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {sectionArticles.map((article) => (
                    <Link key={article.article_number} to={`/article/${article.article_number}`}>
                      <Card className={`hover:border-primary transition-colors cursor-pointer ${isRead(article.article_number) ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isRead(article.article_number) && (
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <div>
                              <span className="text-sm text-muted-foreground">Article {article.article_number}</span>
                              <h3 className="font-medium">{article.title}</h3>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="space-y-3">
            {chapterArticles.map((article) => (
              <Link key={article.article_number} to={`/article/${article.article_number}`}>
                <Card className={`hover:border-primary transition-colors cursor-pointer ${isRead(article.article_number) ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isRead(article.article_number) && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-sm text-muted-foreground">Article {article.article_number}</span>
                        <h3 className="font-medium">{article.title}</h3>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChapterPage;

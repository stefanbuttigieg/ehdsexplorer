import { useParams, Link } from "react-router-dom";
import { ChevronRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getChapterById, chapters } from "@/data/chapters";
import { articles } from "@/data/articles";
import Layout from "@/components/Layout";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import PrintButton from "@/components/PrintButton";

const ChapterPage = () => {
  const { id } = useParams();
  const chapterId = parseInt(id || "1");
  const chapter = getChapterById(chapterId);
  const { isRead, getChapterProgress } = useReadingProgress();

  if (!chapter) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Chapter not found</h1>
        </div>
      </Layout>
    );
  }

  const chapterArticles = articles.filter(
    (a) => a.id >= chapter.articleRange[0] && a.id <= chapter.articleRange[1]
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: `Chapter ${chapter.id}` }]} />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <Badge variant="outline" className="mb-2">Chapter {chapter.id}</Badge>
            <h1 className="text-3xl font-bold font-serif">{chapter.title}</h1>
          </div>
          <PrintButton />
        </div>
        <p className="text-muted-foreground mb-4">{chapter.description}</p>
        
        {/* Reading Progress */}
        {(() => {
          const progress = getChapterProgress(chapter.articleRange);
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

        {chapter.sections ? (
          chapter.sections.map((section, idx) => {
            const sectionArticles = chapterArticles.filter(
              (a) => a.id >= section.articleRange[0] && a.id <= section.articleRange[1]
            );
            return (
              <div key={idx} className="mb-8">
                <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
                <div className="space-y-3">
                  {sectionArticles.map((article) => (
                    <Link key={article.id} to={`/article/${article.id}`}>
                      <Card className={`hover:border-primary transition-colors cursor-pointer ${isRead(article.id) ? 'border-primary/30 bg-primary/5' : ''}`}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {isRead(article.id) && (
                              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                            <div>
                              <span className="text-sm text-muted-foreground">Article {article.id}</span>
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
              <Link key={article.id} to={`/article/${article.id}`}>
                <Card className={`hover:border-primary transition-colors cursor-pointer ${isRead(article.id) ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isRead(article.id) && (
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <div>
                        <span className="text-sm text-muted-foreground">Article {article.id}</span>
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

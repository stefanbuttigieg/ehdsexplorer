import { Link } from "react-router-dom";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { getArticleById, articles } from "@/data/articles";
import { getChapterByArticle } from "@/data/chapters";

export const ContinueReading = () => {
  const { lastRead, readArticles } = useReadingProgress();

  if (!lastRead) return null;

  const lastArticle = getArticleById(lastRead);
  const lastChapter = lastArticle ? getChapterByArticle(lastRead) : null;

  // Find next unread article
  const nextUnread = articles.find(
    (a) => a.id > lastRead && !readArticles.includes(a.id)
  );
  const nextChapter = nextUnread ? getChapterByArticle(nextUnread.id) : null;

  return (
    <section className="py-8 px-4 border-b border-border">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Continue Reading
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Last Read */}
          {lastArticle && (
            <Link to={`/article/${lastRead}`}>
              <Card className="h-full hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">
                    Last read
                  </span>
                  <h3 className="font-medium mt-1">Article {lastArticle.id}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {lastArticle.title}
                  </p>
                  {lastChapter && (
                    <span className="text-xs text-muted-foreground mt-2 block">
                      Chapter {lastChapter.id}: {lastChapter.title}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          )}

          {/* Next Suggested */}
          {nextUnread ? (
            <Link to={`/article/${nextUnread.id}`}>
              <Card className="h-full hover:border-primary transition-colors bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <span className="text-xs text-primary uppercase tracking-wide font-medium">
                    Up next
                  </span>
                  <h3 className="font-medium mt-1">Article {nextUnread.id}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {nextUnread.title}
                  </p>
                  {nextChapter && (
                    <span className="text-xs text-muted-foreground mt-2 block">
                      Chapter {nextChapter.id}: {nextChapter.title}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="h-full bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">
                  You've read all articles!
                </span>
                <Link to="/overview" className="mt-2">
                  <Button variant="outline" size="sm">
                    View Overview <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

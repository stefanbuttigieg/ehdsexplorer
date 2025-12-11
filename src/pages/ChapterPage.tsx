import { useParams, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getChapterById, chapters } from "@/data/chapters";
import { articles } from "@/data/articles";
import Layout from "@/components/Layout";

const ChapterPage = () => {
  const { id } = useParams();
  const chapterId = parseInt(id || "1");
  const chapter = getChapterById(chapterId);

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
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Chapter {chapter.id}</span>
        </nav>

        <Badge variant="outline" className="mb-2">Chapter {chapter.id}</Badge>
        <h1 className="text-3xl font-bold font-serif mb-4">{chapter.title}</h1>
        <p className="text-muted-foreground mb-8">{chapter.description}</p>

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
                      <Card className="hover:border-primary transition-colors cursor-pointer">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <span className="text-sm text-muted-foreground">Article {article.id}</span>
                            <h3 className="font-medium">{article.title}</h3>
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
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <span className="text-sm text-muted-foreground">Article {article.id}</span>
                      <h3 className="font-medium">{article.title}</h3>
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

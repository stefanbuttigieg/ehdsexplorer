import { Link } from "react-router-dom";
import { Bookmark, FileText, Scale, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBookmarks } from "@/hooks/useBookmarks";
import { getArticleById } from "@/data/articles";
import { getRecitalById } from "@/data/recitals";
import { getActById } from "@/data/implementingActs";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const BookmarksPage = () => {
  const { bookmarks, getBookmarksByType, toggleBookmark } = useBookmarks();

  const articleBookmarks = getBookmarksByType('article');
  const recitalBookmarks = getBookmarksByType('recital');
  const actBookmarks = getBookmarksByType('act');

  if (bookmarks.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
          <Breadcrumbs items={[{ label: "Bookmarks" }]} />
          <div className="text-center py-12">
            <Bookmark className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">No bookmarks yet</h1>
            <p className="text-muted-foreground mb-6">Save articles, recitals, and implementing acts for quick access</p>
            <Link to="/"><Button>Start exploring</Button></Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Bookmarks" }]} />
        <h1 className="text-3xl font-bold font-serif mb-6">Bookmarks</h1>

        {articleBookmarks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="h-5 w-5" /> Articles</h2>
            <div className="space-y-3">
              {articleBookmarks.map(b => {
                const article = getArticleById(b.id as number);
                return article ? (
                  <Link key={b.id} to={`/article/${b.id}`}>
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">Article {article.id}</Badge>
                          <h3 className="font-medium">{article.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); toggleBookmark('article', b.id); }}>
                          <Bookmark className="h-4 w-4 fill-current" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}

        {actBookmarks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ListChecks className="h-5 w-5" /> Implementing Acts</h2>
            <div className="space-y-3">
              {actBookmarks.map(b => {
                const act = getActById(b.id as string);
                return act ? (
                  <Link key={b.id} to={`/implementing-acts/${b.id}`}>
                    <Card className="hover:border-primary transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">{act.articleReference}</Badge>
                          <h3 className="font-medium">{act.title}</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); toggleBookmark('act', b.id); }}>
                          <Bookmark className="h-4 w-4 fill-current" />
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ) : null;
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BookmarksPage;

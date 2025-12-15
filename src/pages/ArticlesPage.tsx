import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useArticles } from "@/hooks/useArticles";

const ArticlesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: articles, isLoading } = useArticles();

  const filteredArticles = articles?.filter((article) => {
    const query = searchQuery.toLowerCase();
    return (
      article.title.toLowerCase().includes(query) ||
      article.content.toLowerCase().includes(query) ||
      article.article_number.toString().includes(query)
    );
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Articles" }]} />
        <h1 className="text-3xl font-bold font-serif mb-2">Articles</h1>
        <p className="text-muted-foreground mb-6">
          Browse all {articles?.length || ''} articles of the EHDS Regulation
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search articles by number, title, or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-48 mb-3" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Link to={`/article/${article.article_number}`}>
                      <Badge variant="outline" className="hover:bg-primary/10 cursor-pointer">
                        Article {article.article_number}
                      </Badge>
                    </Link>
                    {article.chapter_id && (
                      <span className="text-xs text-muted-foreground">
                        Chapter {article.chapter_id}
                      </span>
                    )}
                  </div>
                  <Link 
                    to={`/article/${article.article_number}`}
                    className="text-lg font-medium hover:text-primary transition-colors"
                  >
                    {article.title}
                  </Link>
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                    {article.content.substring(0, 200)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            {searchQuery ? "No articles found matching your search." : "No articles available."}
          </p>
        )}
      </div>
    </Layout>
  );
};

export default ArticlesPage;

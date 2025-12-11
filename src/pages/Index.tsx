import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Book, FileText, Scale, ListChecks, Bookmark, ChevronRight, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { chapters } from "@/data/chapters";
import { getActStats } from "@/data/implementingActs";
import Layout from "@/components/Layout";
import { useReadingProgress } from "@/hooks/useReadingProgress";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const actStats = getActStats();
  const { getChapterProgress } = useReadingProgress();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Hero Section */}
        <section className="text-center py-12 px-4 border-b border-border">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm mb-4">
              <Scale className="h-4 w-4" />
              Regulation (EU) 2025/327
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
              EHDS Regulation Explorer
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Navigate, search, and understand the European Health Data Space Regulation
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles, recitals, definitions..."
                  className="pl-12 pr-4 py-6 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-8 px-4 border-b border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Link to="/overview">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Book className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Overview</p>
                      <p className="text-sm text-muted-foreground">Quick summary</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/definitions">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Definitions</p>
                      <p className="text-sm text-muted-foreground">28 terms</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/annexes">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Files className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Annexes</p>
                      <p className="text-sm text-muted-foreground">4 annexes</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/implementing-acts">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <ListChecks className="h-8 w-8 text-secondary" />
                    <div>
                      <p className="font-semibold">Impl. Acts</p>
                      <p className="text-sm text-muted-foreground">{actStats.consultation || 0} in consultation</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/bookmarks">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Bookmark className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Bookmarks</p>
                      <p className="text-sm text-muted-foreground">Saved items</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 font-serif">Chapters</h2>
            <div className="grid md:grid-cols-2 gap-4">
            {chapters.map((chapter) => {
                const progress = getChapterProgress(chapter.articleRange);
                return (
                  <Link key={chapter.id} to={`/chapter/${chapter.id}`}>
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Chapter {chapter.id}</span>
                          <span className="text-xs text-muted-foreground">
                            Art. {chapter.articleRange[0]}-{chapter.articleRange[1]}
                          </span>
                        </div>
                        <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2">{chapter.description}</CardDescription>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{progress.read}/{progress.total} articles read</span>
                            <span>{progress.percentage}%</span>
                          </div>
                          <Progress value={progress.percentage} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;

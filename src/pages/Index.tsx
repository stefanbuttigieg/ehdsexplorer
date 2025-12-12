import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Book, FileText, Scale, ListChecks, Bookmark, ChevronRight, Files, Clock, MessageSquare, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChapters } from "@/hooks/useChapters";
import { getActStats, implementingActs, themeLabels } from "@/data/implementingActs";
import Layout from "@/components/Layout";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { RecitalsQuickExplorer } from "@/components/RecitalsQuickExplorer";
import { ArticlesQuickExplorer } from "@/components/ArticlesQuickExplorer";
import { ContinueReading } from "@/components/ContinueReading";
import { differenceInDays, parse, isAfter, isBefore } from "date-fns";

const getFeedbackStatus = (deadline: string) => {
  const parts = deadline.split(" - ");
  if (parts.length !== 2) return null;
  
  const startDate = parse(parts[0].trim(), "dd MMMM yyyy", new Date());
  const endDate = parse(parts[1].trim(), "dd MMMM yyyy", new Date());
  const now = new Date();
  
  if (isBefore(now, startDate)) {
    const days = differenceInDays(startDate, now);
    return { status: 'upcoming', days, label: `Opens in ${days} days` };
  }
  
  if (isAfter(now, endDate)) {
    return null; // Don't show closed ones
  }
  
  const days = differenceInDays(endDate, now);
  return { status: 'active', days, label: `${days} days remaining` };
};

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const actStats = getActStats();
  const { getChapterProgress } = useReadingProgress();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();

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

        {/* Continue Reading */}
        <ContinueReading />

        {/* Open for Feedback Section */}
        {(() => {
          const feedbackActs = implementingActs
            .filter(act => act.status === 'feedback' && act.feedbackDeadline)
            .map(act => ({ ...act, feedbackStatus: getFeedbackStatus(act.feedbackDeadline!) }))
            .filter(act => act.feedbackStatus !== null);
          
          if (feedbackActs.length === 0) return null;
          
          return (
            <section className="py-8 px-4 border-b border-border bg-primary/5">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold font-serif">Open for Feedback</h2>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedbackActs.map(act => (
                    <Card key={act.id} className="border-primary/20 bg-background">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline">{act.articleReference}</Badge>
                          <Badge variant="default" className="bg-primary">
                            <Clock className="h-3 w-3 mr-1" />
                            {act.feedbackStatus?.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{act.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{act.description}</p>
                        <div className="flex items-center gap-2">
                          <Link to={`/implementing-acts/${act.id}`}>
                            <Button variant="outline" size="sm">View details</Button>
                          </Link>
                          {act.officialLink && (
                            <a href={act.officialLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="default" size="sm">
                                Submit feedback <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

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
                      <p className="text-sm text-muted-foreground">{actStats.feedback || 0} open for feedback</p>
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
              {chaptersLoading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="h-full">
                      <CardHeader className="pb-2">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-48" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : chapters && chapters.length > 0 ? (
                chapters.map((chapter) => (
                  <Link key={chapter.id} to={`/chapter/${chapter.chapter_number}`}>
                    <Card className="hover:border-primary hover:shadow-md transition-all cursor-pointer h-full">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Chapter {chapter.chapter_number}</span>
                        </div>
                        <CardTitle className="text-lg">{chapter.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2">{chapter.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground col-span-2">No chapters configured yet.</p>
              )}
            </div>
          </div>
        </section>
        {/* Articles Quick Explorer */}
        <section className="py-12 px-4 border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-serif">Articles</h2>
              <Link to="/chapter/1" className="text-sm text-primary hover:underline">
                Browse by chapter →
              </Link>
            </div>
            <ArticlesQuickExplorer />
          </div>
        </section>

        {/* Recitals Quick Explorer */}
        <section className="py-12 px-4 border-t border-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold font-serif">Recitals</h2>
              <Link to="/recitals" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
            <RecitalsQuickExplorer />
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;

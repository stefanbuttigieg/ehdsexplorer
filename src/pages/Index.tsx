import { useState } from "react";
import { Link } from "react-router-dom";
import { SearchCommand } from "@/components/SearchCommand";
import { Search, Book, FileText, Scale, ListChecks, Bookmark, Files, Clock, MessageSquare, ExternalLink, Gamepad2, Newspaper, StickyNote, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useChapters } from "@/hooks/useChapters";
import { useImplementingActs, getActStats } from "@/hooks/useImplementingActs";
import { useDefinitions } from "@/hooks/useDefinitions";
import { useNewsSummaries } from "@/hooks/useNewsSummaries";
import Layout from "@/components/Layout";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { RecitalsQuickExplorer } from "@/components/RecitalsQuickExplorer";
import { ArticlesQuickExplorer } from "@/components/ArticlesQuickExplorer";
import { ContinueReading } from "@/components/ContinueReading";
import { SignupCTA } from "@/components/SignupCTA";
import { differenceInDays, parse, isAfter, isBefore, format } from "date-fns";

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
  const [searchOpen, setSearchOpen] = useState(false);
  const { getChapterProgress } = useReadingProgress();
  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: implementingActs = [] } = useImplementingActs();
  const { data: definitions = [] } = useDefinitions();
  const { data: newsSummaries = [] } = useNewsSummaries(true);
  const actStats = getActStats(implementingActs);

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
            <div className="max-w-xl mx-auto">
              <div 
                className="relative cursor-pointer"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <div className="pl-12 pr-4 py-4 text-lg border border-input rounded-md bg-background text-muted-foreground hover:border-primary transition-colors">
                  Search articles, recitals, definitions...
                </div>
                <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-muted rounded">/</kbd>
              </div>
            </div>

            {/* Search Command */}
            <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />
          </div>
        </section>

        {/* Signup CTA for non-logged-in users */}
        <SignupCTA />

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {feedbackActs.map(act => (
                    <Card key={act.id} className="border-primary/20 bg-background">
                      <CardContent className="p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">{act.articleReference}</Badge>
                          <Badge variant="default" className="bg-primary text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {act.feedbackStatus?.label}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1 text-sm sm:text-base">{act.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">{act.description}</p>
                        <div className="flex flex-col gap-2">
                          <Link to={`/implementing-acts/${act.id}`} className="w-full">
                            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">View details</Button>
                          </Link>
                          {act.officialLink && (
                            <a href={act.officialLink} target="_blank" rel="noopener noreferrer" className="w-full">
                              <Button variant="default" size="sm" className="w-full text-xs sm:text-sm">
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

        {/* Latest News Section */}
        <section className="py-8 px-4 border-b border-border bg-secondary/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-secondary" />
                <h2 className="text-xl font-bold font-serif">Latest News</h2>
              </div>
              <Link to="/news" className="text-sm text-primary hover:underline">
                View all →
              </Link>
            </div>
            {newsSummaries.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsSummaries.slice(0, 3).map(summary => (
                  <Card key={summary.id} className="border-secondary/20 bg-background">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {format(new Date(summary.week_start), "MMM d")} - {format(new Date(summary.week_end), "MMM d, yyyy")}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-2 line-clamp-2">{summary.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{summary.summary}</p>
                      <Link to={`/news/${summary.id}`}>
                        <Button variant="outline" size="sm">Read more</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-secondary/20 bg-background">
                <CardContent className="p-6 text-center text-muted-foreground">
                  <p>No news summaries published yet. Check back soon for weekly EHDS updates.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-8 px-4 border-b border-border bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
                      <p className="text-sm text-muted-foreground">{definitions.length} terms</p>
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
              <Link to="/implementing-acts" data-tour="implementing-acts">
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
              <Link to="/notes">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <StickyNote className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Notes</p>
                      <p className="text-sm text-muted-foreground">Annotations</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/match-game">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Gamepad2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Match Game</p>
                      <p className="text-sm text-muted-foreground">Match terms</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link to="/flashcards">
                <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex items-center gap-3">
                    <GraduationCap className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold">Flashcards</p>
                      <p className="text-sm text-muted-foreground">Study cards</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <section className="py-12 px-4 border-t border-border bg-muted/30" data-tour="quick-explorers">
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

import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { ChevronRight, Globe, Clock, ExternalLink, CalendarClock, CalendarX, Search, ArrowUpDown } from "lucide-react";
import { ComitologyUpdatesCard } from "@/components/ComitologyUpdatesCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useImplementingActs, themeLabels, statusLabels, ActStatus, ActTheme, getActStats } from "@/hooks/useImplementingActs";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SubscribeAlertButton } from "@/components/SubscribeAlertButton";
import { differenceInDays, parse, isAfter, isBefore } from "date-fns";

type SortMode = 'theme' | 'article';

const getFeedbackDaysRemaining = (deadline: string) => {
  const parts = deadline.split(" - ");
  if (parts.length !== 2) return null;
  
  const startDate = parse(parts[0].trim(), "dd MMMM yyyy", new Date());
  const endDate = parse(parts[1].trim(), "dd MMMM yyyy", new Date());
  const now = new Date();
  
  if (isBefore(now, startDate)) {
    const days = differenceInDays(startDate, now);
    return { status: 'upcoming', days, label: `Opens in ${days}d` };
  }
  
  if (isAfter(now, endDate)) {
    return { status: 'closed', days: 0, label: 'Closed' };
  }
  
  const days = differenceInDays(endDate, now);
  return { status: 'active', days, label: `${days}d left` };
};

const extractFirstArticleNumber = (ref: string): number => {
  const match = ref.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 999;
};

const ImplementingActsPage = () => {
  const [filterStatus, setFilterStatus] = useState<ActStatus | 'all'>('all');
  const [filterTheme, setFilterTheme] = useState<ActTheme | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('theme');
  const { data: implementingActs = [], isLoading } = useImplementingActs();
  const stats = getActStats(implementingActs);

  const filteredActs = useMemo(() => {
    return implementingActs.filter(act => {
      if (filterStatus !== 'all' && act.status !== filterStatus) return false;
      if (filterTheme !== 'all' && !act.themes.includes(filterTheme)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesRef = act.articleReference.toLowerCase().includes(q);
        const matchesArticles = act.relatedArticles.some(a => `article ${a}`.includes(q) || `${a}` === q);
        if (!matchesTitle && !matchesDesc && !matchesRef && !matchesArticles) return false;
      }
      return true;
    });
  }, [implementingActs, filterStatus, filterTheme, searchQuery]);

  const sortedActs = useMemo(() => {
    if (sortMode === 'article') {
      return [...filteredActs].sort((a, b) => {
        const aNum = a.relatedArticles.length > 0 ? Math.min(...a.relatedArticles) : extractFirstArticleNumber(a.articleReference);
        const bNum = b.relatedArticles.length > 0 ? Math.min(...b.relatedArticles) : extractFirstArticleNumber(b.articleReference);
        return aNum - bNum;
      });
    }
    return filteredActs;
  }, [filteredActs, sortMode]);

  // Group by primary theme (first theme in array) - only for theme sort
  const groupedByTheme = useMemo(() => {
    if (sortMode === 'article') return null;
    return sortedActs.reduce((acc, act) => {
      const primaryTheme = act.themes[0] || act.theme;
      if (!acc[primaryTheme]) acc[primaryTheme] = [];
      acc[primaryTheme].push(act);
      return acc;
    }, {} as Record<ActTheme, typeof implementingActs>);
  }, [sortedActs, sortMode]);

  const renderActCard = (act: typeof implementingActs[0]) => (
    <Link key={act.id} to={`/implementing-acts/${act.id}`}>
      <Card className="hover:border-primary transition-colors cursor-pointer">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between gap-2 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                <Badge variant="outline" className="text-xs">{act.articleReference}</Badge>
                <Badge variant={act.type === 'delegated' ? 'secondary' : 'outline'} className="text-xs">{act.type}</Badge>
                <span className={`status-badge status-${act.status} text-xs`}>{statusLabels[act.status]}</span>
                
                <span className="hidden sm:contents">
                  {act.feedbackDeadline ? (
                    <Badge variant="outline" className="text-primary border-primary/50">
                      <CalendarClock className="h-3 w-3 mr-1" />
                      With Deadline
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <CalendarX className="h-3 w-3 mr-1" />
                      No Deadline
                    </Badge>
                  )}
                </span>
                
                {act.deliverableLink && (
                  <Badge variant="outline" className="text-primary border-primary/50 text-xs">
                    <Globe className="h-3 w-3 mr-0.5 sm:mr-1" />
                    Live
                  </Badge>
                )}
                {act.status === 'feedback' && act.feedbackDeadline && (() => {
                  const feedbackStatus = getFeedbackDaysRemaining(act.feedbackDeadline);
                  return feedbackStatus ? (
                    <Badge 
                      variant={feedbackStatus.status === 'active' ? 'default' : 'outline'}
                      className={`text-xs ${feedbackStatus.status === 'active' ? 'bg-primary' : ''}`}
                    >
                      <Clock className="h-3 w-3 mr-0.5 sm:mr-1" />
                      {feedbackStatus.label}
                    </Badge>
                  ) : null;
                })()}
              </div>
              <h3 className="font-medium text-sm sm:text-base leading-snug">{act.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">{act.description}</p>
              {act.relatedArticles.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {act.relatedArticles.map(a => (
                    <Badge key={a} variant="outline" className="text-xs text-muted-foreground">Art. {a}</Badge>
                  ))}
                </div>
              )}
              {act.themes.length > 1 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {act.themes.map(t => (
                    <Badge key={t} variant="secondary" className="text-xs">
                      {themeLabels[t]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-4 sm:p-6 animate-fade-in pb-20 md:pb-6">
        <Breadcrumbs items={[{ label: "Implementing Acts" }]} />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif">Implementing Acts Tracker</h1>
          <SubscribeAlertButton implementingActId="" implementingActTitle="All Implementing Acts" />
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mb-4">Track the progress of delegated and implementing acts required by the EHDS Regulation</p>

        {/* Comitology Register Updates */}
        <ComitologyUpdatesCard />

        {/* Stats - scrollable on mobile */}
        <div className="flex gap-3 mb-8 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory md:grid md:grid-cols-5 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
          {(['pending', 'feedback', 'feedback-closed', 'progress', 'adopted'] as ActStatus[]).map(status => (
            <Card key={status} className={`cursor-pointer min-w-[120px] snap-start flex-shrink-0 md:min-w-0 md:flex-shrink ${filterStatus === status ? 'border-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className={`text-2xl sm:text-3xl font-bold status-${status}`}>{stats[status] || 0}</div>
                <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{statusLabels[status]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search acts by title, article reference, or description..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="flex-shrink-0 gap-1.5"
            onClick={() => setSortMode(sortMode === 'theme' ? 'article' : 'theme')}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortMode === 'theme' ? 'Sort by Article' : 'Sort by Theme'}
          </Button>
        </div>

        {/* Filters - horizontally scrollable on mobile */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-2 px-2 md:flex-wrap md:overflow-visible md:pb-0 md:mx-0 md:px-0">
          <Button variant={filterTheme === 'all' ? 'default' : 'outline'} size="sm" className="flex-shrink-0" onClick={() => setFilterTheme('all')}>All Themes</Button>
          {(Object.keys(themeLabels) as ActTheme[]).map(theme => (
            <Button key={theme} variant={filterTheme === theme ? 'default' : 'outline'} size="sm" className="flex-shrink-0 whitespace-nowrap" onClick={() => setFilterTheme(filterTheme === theme ? 'all' : theme)}>
              {themeLabels[theme]}
            </Button>
          ))}
        </div>

        {/* Results count */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground mb-4">
            {sortedActs.length} result{sortedActs.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Acts by Theme or flat sorted list */}
        {sortMode === 'theme' && groupedByTheme ? (
          Object.entries(groupedByTheme).map(([theme, acts]) => (
            <div key={theme} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">{themeLabels[theme as ActTheme]}</h2>
              <div className="space-y-3">
                {acts.map(renderActCard)}
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            {sortedActs.map(renderActCard)}
          </div>
        )}

        {sortedActs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">No implementing acts found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ImplementingActsPage;

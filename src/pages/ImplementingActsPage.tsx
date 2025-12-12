import { Link } from "react-router-dom";
import { useState } from "react";
import { ChevronRight, Globe, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useImplementingActs, themeLabels, statusLabels, ActStatus, ActTheme, getActStats } from "@/hooks/useImplementingActs";
import Layout from "@/components/Layout";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { differenceInDays, parse, isAfter, isBefore } from "date-fns";

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

const ImplementingActsPage = () => {
  const [filterStatus, setFilterStatus] = useState<ActStatus | 'all'>('all');
  const [filterTheme, setFilterTheme] = useState<ActTheme | 'all'>('all');
  const { data: implementingActs = [], isLoading } = useImplementingActs();
  const stats = getActStats(implementingActs);

  const filteredActs = implementingActs.filter(act => {
    if (filterStatus !== 'all' && act.status !== filterStatus) return false;
    if (filterTheme !== 'all' && act.theme !== filterTheme) return false;
    return true;
  });

  const groupedByTheme = filteredActs.reduce((acc, act) => {
    if (!acc[act.theme]) acc[act.theme] = [];
    acc[act.theme].push(act);
    return acc;
  }, {} as Record<ActTheme, typeof implementingActs>);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
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
      <div className="max-w-5xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Implementing Acts" }]} />
        <h1 className="text-3xl font-bold font-serif mb-2">Implementing Acts Tracker</h1>
        <p className="text-muted-foreground mb-8">Track the progress of delegated and implementing acts required by the EHDS Regulation</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(['pending', 'feedback', 'progress', 'adopted'] as ActStatus[]).map(status => (
            <Card key={status} className={`cursor-pointer ${filterStatus === status ? 'border-primary' : ''}`} onClick={() => setFilterStatus(filterStatus === status ? 'all' : status)}>
              <CardContent className="p-4 text-center">
                <div className={`text-3xl font-bold status-${status}`}>{stats[status] || 0}</div>
                <div className="text-sm text-muted-foreground">{statusLabels[status]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant={filterTheme === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilterTheme('all')}>All Themes</Button>
          {(Object.keys(themeLabels) as ActTheme[]).map(theme => (
            <Button key={theme} variant={filterTheme === theme ? 'default' : 'outline'} size="sm" onClick={() => setFilterTheme(filterTheme === theme ? 'all' : theme)}>
              {themeLabels[theme]}
            </Button>
          ))}
        </div>

        {/* Acts by Theme */}
        {Object.entries(groupedByTheme).map(([theme, acts]) => (
          <div key={theme} className="mb-8">
            <h2 className="text-xl font-semibold mb-4">{themeLabels[theme as ActTheme]}</h2>
            <div className="space-y-3">
              {acts.map(act => (
                <Link key={act.id} to={`/implementing-acts/${act.id}`}>
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="outline">{act.articleReference}</Badge>
                            <Badge variant={act.type === 'delegated' ? 'secondary' : 'outline'}>{act.type}</Badge>
                            <span className={`status-badge status-${act.status}`}>{statusLabels[act.status]}</span>
                            {act.deliverableLink && (
                              <Badge variant="outline" className="text-primary border-primary/50">
                                <Globe className="h-3 w-3 mr-1" />
                                Live
                              </Badge>
                            )}
                            {act.status === 'feedback' && act.feedbackDeadline && (() => {
                              const feedbackStatus = getFeedbackDaysRemaining(act.feedbackDeadline);
                              return feedbackStatus ? (
                                <Badge 
                                  variant={feedbackStatus.status === 'active' ? 'default' : 'outline'}
                                  className={feedbackStatus.status === 'active' ? 'bg-primary' : ''}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {feedbackStatus.label}
                                </Badge>
                              ) : null;
                            })()}
                          </div>
                          <h3 className="font-medium">{act.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{act.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ImplementingActsPage;

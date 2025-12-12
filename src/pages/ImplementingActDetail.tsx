import { useParams, Link } from "react-router-dom";
import { ExternalLink, Calendar, Bookmark, Globe, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useImplementingAct, statusLabels, themeLabels } from "@/hooks/useImplementingActs";
import { useArticles } from "@/hooks/useArticles";
import { useJointActionDeliverables, getDeliverablesByImplementingAct } from "@/hooks/useJointActionDeliverables";
import Layout from "@/components/Layout";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { differenceInDays, parse, isAfter, isBefore } from "date-fns";

const parseFeedbackDeadline = (deadline: string) => {
  const parts = deadline.split(" - ");
  if (parts.length !== 2) return null;
  
  const startDate = parse(parts[0].trim(), "dd MMMM yyyy", new Date());
  const endDate = parse(parts[1].trim(), "dd MMMM yyyy", new Date());
  
  return { startDate, endDate };
};

const getFeedbackStatus = (deadline: string) => {
  const dates = parseFeedbackDeadline(deadline);
  if (!dates) return null;
  
  const now = new Date();
  const { startDate, endDate } = dates;
  
  if (isBefore(now, startDate)) {
    const daysUntilStart = differenceInDays(startDate, now);
    return { status: 'upcoming', days: daysUntilStart, label: `Opens in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}` };
  }
  
  if (isAfter(now, endDate)) {
    return { status: 'closed', days: 0, label: 'Feedback period closed' };
  }
  
  const daysRemaining = differenceInDays(endDate, now);
  return { status: 'active', days: daysRemaining, label: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining` };
};

const ImplementingActDetail = () => {
  const { id } = useParams();
  const { data: act, isLoading } = useImplementingAct(id || "");
  const { data: articles = [] } = useArticles();
  const { data: jointActionDeliverables = [] } = useJointActionDeliverables();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const relatedDeliverables = act ? getDeliverablesByImplementingAct(jointActionDeliverables, act.id) : [];

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-8" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!act) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <h1 className="text-2xl font-bold">Act not found</h1>
          <Link to="/implementing-acts"><Button className="mt-4">Back to tracker</Button></Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <Breadcrumbs items={[{ label: "Implementing Acts", href: "/implementing-acts" }, { label: act.articleReference }]} />

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{act.articleReference}</Badge>
              <Badge variant={act.type === 'delegated' ? 'secondary' : 'outline'}>{act.type} act</Badge>
              <span className={`status-badge status-${act.status}`}>{statusLabels[act.status]}</span>
            </div>
            <h1 className="text-3xl font-bold font-serif">{act.title}</h1>
          </div>
          <Button
            variant={isBookmarked('act', act.id) ? "default" : "outline"}
            size="icon"
            onClick={() => toggleBookmark('act', act.id)}
          >
            <Bookmark className={isBookmarked('act', act.id) ? "fill-current" : ""} />
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <p className="text-muted-foreground mb-4">{themeLabels[act.theme]}</p>
            <p className="legal-text">{act.description}</p>

            {act.deliverableLink && (
              <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Globe className="h-5 w-5" />
                  <span className="font-medium">Live Deliverable</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{act.deliverableName || act.title}</p>
                <a href={act.deliverableLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  View platform <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {act.status === 'feedback' && act.feedbackDeadline && (() => {
              const feedbackStatus = getFeedbackStatus(act.feedbackDeadline);
              return (
                <div className="mt-6 p-4 rounded-lg bg-accent border border-accent-foreground/20">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2 text-accent-foreground">
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">Feedback period: {act.feedbackDeadline}</span>
                    </div>
                    {feedbackStatus && (
                      <Badge 
                        variant={feedbackStatus.status === 'active' ? 'default' : feedbackStatus.status === 'upcoming' ? 'secondary' : 'outline'}
                        className={feedbackStatus.status === 'active' ? 'bg-primary' : ''}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {feedbackStatus.label}
                      </Badge>
                    )}
                  </div>
                  {act.officialLink && (
                    <a href={act.officialLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      Submit feedback <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Related Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {act.relatedArticles.map(artId => {
              const article = articles.find(a => a.article_number === artId);
              return article ? (
                <Link key={artId} to={`/article/${artId}`}>
                  <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                    <span className="text-sm text-muted-foreground">Article {artId}</span>
                    <p className="font-medium">{article.title}</p>
                  </div>
                </Link>
              ) : null;
            })}
          </CardContent>
        </Card>

        {/* Joint Action Deliverables */}
        {relatedDeliverables.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Joint Action Deliverables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {relatedDeliverables.map((deliverable) => (
                <a 
                  key={deliverable.id} 
                  href={deliverable.deliverable_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="p-3 rounded-lg bg-muted hover:bg-accent transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{deliverable.deliverable_name}</span>
                        <p className="text-sm text-muted-foreground">{deliverable.joint_action_name}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </a>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ImplementingActDetail;

import { useParams, Link } from "react-router-dom";
import { ChevronRight, ExternalLink, Calendar, Bookmark, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getActById, statusLabels, themeLabels } from "@/data/implementingActs";
import { getArticleById } from "@/data/articles";
import Layout from "@/components/Layout";
import { useBookmarks } from "@/hooks/useBookmarks";
import { Breadcrumbs } from "@/components/Breadcrumbs";

const ImplementingActDetail = () => {
  const { id } = useParams();
  const act = getActById(id || "");
  const { isBookmarked, toggleBookmark } = useBookmarks();

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

            {act.status === 'consultation' && act.consultationDeadline && (
              <div className="mt-6 p-4 rounded-lg bg-accent border border-accent-foreground/20">
                <div className="flex items-center gap-2 text-accent-foreground">
                  <Calendar className="h-5 w-5" />
                  <span className="font-medium">Consultation deadline: {act.consultationDeadline}</span>
                </div>
                {act.officialLink && (
                  <a href={act.officialLink} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    Submit feedback <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Articles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {act.relatedArticles.map(artId => {
              const article = getArticleById(artId);
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
      </div>
    </Layout>
  );
};

export default ImplementingActDetail;

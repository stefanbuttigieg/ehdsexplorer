import { SEOHead, BreadcrumbSchema } from "@/components/seo";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Newspaper, Calendar, ChevronRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsSummaries } from '@/hooks/useNewsSummaries';

const NewsPage = () => {
  const { data: summaries, isLoading } = useNewsSummaries(true);

  return (
    <Layout>
      <SEOHead title="EHDS News Archive – EHDS Explorer" description="Archived summaries of European Health Data Space developments, with their original reporting periods." url="/news" />
      <BreadcrumbSchema items={[{name:"Home",url:"/"},{name:"News Archive",url:"/news"}]} />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Newspaper className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">EHDS News Archive</h1>
          </div>
          <p className="text-muted-foreground">
            Historical summaries, not a current weekly news feed. Dates reflect the original reporting periods.
          </p>
          <p className="text-muted-foreground mt-3">
            For current implementation status and committee meetings, visit the{' '}
            <Link to="/implementing-acts" className="text-primary hover:underline">Implementing Acts tracker</Link>.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : summaries && summaries.length > 0 ? (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Link key={summary.id} to={`/news/${summary.id}`} className="block">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl hover:text-primary transition-colors">
                          {summary.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Week of {format(new Date(summary.week_start), 'MMM d')} - {format(new Date(summary.week_end), 'MMM d, yyyy')}
                          </span>
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {summary.generated_by === 'ai' ? 'AI Generated' : 'Manual'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-3">
                      {summary.summary.substring(0, 250)}...
                    </p>
                    <div className="flex items-center gap-1 text-primary text-sm mt-4 font-medium">
                      Read full summary <ChevronRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Archived Summaries</h3>
              <p className="text-muted-foreground">
                There are no published summaries in the archive.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default NewsPage;

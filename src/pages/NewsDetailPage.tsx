import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Calendar, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsSummary } from '@/hooks/useNewsSummaries';

const NewsDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: summary, isLoading, error } = useNewsSummary(id || '');

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/4 mb-8" />
          <Skeleton className="h-96 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !summary) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Summary Not Found</h1>
          <p className="text-muted-foreground mb-6">This news summary could not be found or is not published.</p>
          <Button asChild>
            <Link to="/news">Back to News</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>{summary.title} | EHDS News</title>
        <meta name="description" content={summary.summary.substring(0, 160)} />
      </Helmet>

      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/news">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to News
          </Link>
        </Button>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{summary.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Week of {format(new Date(summary.week_start), 'MMMM d')} - {format(new Date(summary.week_end), 'MMMM d, yyyy')}
                </span>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {summary.generated_by === 'ai' ? 'AI Generated' : 'Manual'}
              </Badge>
            </div>
          </header>

          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{summary.summary}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Published on {format(new Date(summary.created_at), 'MMMM d, yyyy')}
          </p>
        </article>
      </div>
    </Layout>
  );
};

export default NewsDetailPage;

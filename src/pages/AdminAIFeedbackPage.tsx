import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface FeedbackItem {
  id: string;
  user_id: string;
  message_content: string;
  user_query: string;
  feedback_type: 'positive' | 'negative';
  created_at: string;
}

const AdminAIFeedbackPage = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isAdmin) {
      toast({
        title: 'Access Denied',
        description: 'Only admins can access this page.',
        variant: 'destructive',
      });
      navigate('/admin');
    }
  }, [user, loading, isAdmin, navigate, toast]);

  const { data: feedback, isLoading } = useQuery({
    queryKey: ['ai-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_assistant_feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FeedbackItem[];
    },
    enabled: !!user && isAdmin,
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return {
        total: 0,
        positive: 0,
        negative: 0,
        positiveRate: 0,
        trend: 0,
      };
    }

    const positive = feedback.filter(f => f.feedback_type === 'positive').length;
    const negative = feedback.filter(f => f.feedback_type === 'negative').length;
    const total = feedback.length;
    const positiveRate = Math.round((positive / total) * 100);

    // Calculate trend (last 7 days vs previous 7 days)
    const now = new Date();
    const last7Days = feedback.filter(f => 
      new Date(f.created_at) >= subDays(now, 7)
    );
    const previous7Days = feedback.filter(f => 
      new Date(f.created_at) >= subDays(now, 14) && 
      new Date(f.created_at) < subDays(now, 7)
    );

    const last7Positive = last7Days.filter(f => f.feedback_type === 'positive').length;
    const last7Total = last7Days.length;
    const prev7Positive = previous7Days.filter(f => f.feedback_type === 'positive').length;
    const prev7Total = previous7Days.length;

    const last7Rate = last7Total > 0 ? (last7Positive / last7Total) * 100 : 0;
    const prev7Rate = prev7Total > 0 ? (prev7Positive / prev7Total) * 100 : 0;
    const trend = Math.round(last7Rate - prev7Rate);

    return { total, positive, negative, positiveRate, trend };
  }, [feedback]);

  // Chart data - last 14 days
  const chartData = useMemo(() => {
    if (!feedback) return [];

    const now = new Date();
    const days = eachDayOfInterval({
      start: subDays(now, 13),
      end: now,
    });

    return days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayFeedback = feedback.filter(f => {
        const date = new Date(f.created_at);
        return date >= dayStart && date < dayEnd;
      });

      return {
        date: format(day, 'MMM d'),
        positive: dayFeedback.filter(f => f.feedback_type === 'positive').length,
        negative: dayFeedback.filter(f => f.feedback_type === 'negative').length,
      };
    });
  }, [feedback]);

  // Pie chart data
  const pieData = useMemo(() => {
    if (!stats.total) return [];
    return [
      { name: 'Positive', value: stats.positive, color: 'hsl(var(--chart-2))' },
      { name: 'Negative', value: stats.negative, color: 'hsl(var(--chart-1))' },
    ];
  }, [stats]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-4 md:p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">AI Assistant Feedback</h1>
            <p className="text-muted-foreground">Analyze user feedback to improve response quality</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Feedback</CardDescription>
              <CardTitle className="text-3xl">
                {isLoading ? <Skeleton className="h-9 w-16" /> : stats.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>responses rated</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Positive Rate</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {isLoading ? <Skeleton className="h-9 w-16" /> : `${stats.positiveRate}%`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                {stats.trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {stats.trend >= 0 ? '+' : ''}{stats.trend}% vs last week
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Positive</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <ThumbsUp className="h-6 w-6 text-green-600" />
                {isLoading ? <Skeleton className="h-9 w-12" /> : stats.positive}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">helpful responses</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Negative</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <ThumbsDown className="h-6 w-6 text-red-600" />
                {isLoading ? <Skeleton className="h-9 w-12" /> : stats.negative}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">needs improvement</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Feedback Over Time
              </CardTitle>
              <CardDescription>Daily feedback breakdown for the last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }} 
                    />
                    <Bar dataKey="positive" name="Positive" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="negative" name="Negative" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No feedback data yet
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribution</CardTitle>
              <CardDescription>Overall feedback breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : pieData.length > 0 && stats.total > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest user ratings with query context</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : feedback && feedback.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {feedback.slice(0, 50).map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {item.feedback_type === 'positive' ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <ThumbsUp className="h-3 w-3 mr-1" />
                                Positive
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                                <ThumbsDown className="h-3 w-3 mr-1" />
                                Negative
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                            </span>
                          </div>
                          <p className="text-sm font-medium mb-1">
                            User asked: "{item.user_query}"
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            Response: {item.message_content.substring(0, 200)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No feedback received yet</p>
                <p className="text-sm">Feedback will appear here when users rate AI responses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminAIFeedbackPage;

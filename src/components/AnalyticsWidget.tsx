import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Eye, Clock, Activity, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface PageviewData {
  x: string;
  y: number;
}

interface TopPage {
  x: string;
  y: number;
}

interface AnalyticsResponse {
  configured: boolean;
  error?: string;
  today: UmamiStats;
  week: UmamiStats;
  month: UmamiStats;
  activeVisitors: number;
  pageviewsChart: PageviewData[];
  sessionsChart: PageviewData[];
  topPages: TopPage[];
}

const AnalyticsWidget = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["umami-analytics"],
    queryFn: async (): Promise<AnalyticsResponse> => {
      const { data, error } = await supabase.functions.invoke("get-umami-analytics");
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000, // Refresh every minute
    refetchInterval: 60 * 1000, // Auto-refresh for real-time feel
  });

  const chartData = useMemo(() => {
    if (!data?.pageviewsChart) return [];
    return data.pageviewsChart.map((pv, index) => ({
      date: format(new Date(pv.x), "MMM dd"),
      pageViews: pv.y,
      sessions: data.sessionsChart?.[index]?.y ?? 0,
    }));
  }, [data]);

  const formatTime = (seconds: number) => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes > 0) return `${minutes}m ${totalSeconds % 60}s`;
    return `${totalSeconds}s`;
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Site Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Unable to load analytics data. Please try again later.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data?.configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Site Analytics
          </CardTitle>
          <CardDescription>Configure Umami to see real analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
            <p className="text-sm font-medium">Set up Umami Analytics</p>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
              <li>
                Sign up at{" "}
                <a
                  href="https://cloud.umami.is"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cloud.umami.is
                </a>
              </li>
              <li>Create a website and copy your Website ID</li>
              <li>Go to Settings → API → Create Token</li>
              <li>Add VITE_UMAMI_WEBSITE_ID and UMAMI_API_TOKEN secrets</li>
            </ol>
            <Button variant="outline" size="sm" asChild>
              <a href="https://umami.is/docs/api" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                Umami API Docs
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Site Analytics
              {data.activeVisitors > 0 && (
                <Badge variant="secondary" className="animate-pulse">
                  <Activity className="h-3 w-3 mr-1" />
                  {data.activeVisitors} online
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Powered by Umami Analytics as from 21/12/25 12:00</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Stats */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Today</h4>
          <div className="grid grid-cols-5 gap-3">
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Eye className="h-3.5 w-3.5" />
                Views
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-xl font-bold">{data.today.pageviews.toLocaleString()}</p>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Users className="h-3.5 w-3.5" />
                Visitors
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-xl font-bold">{data.today.visitors.toLocaleString()}</p>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Activity className="h-3.5 w-3.5" />
                Sessions
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-xl font-bold">{data.today.visits.toLocaleString()}</p>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Avg Time
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-xl font-bold">
                  {data.today.visits > 0 ? formatTime(data.today.totaltime / data.today.visits) : "0s"}
                </p>
              )}
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3.5 w-3.5" />
                Bounce
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <p className="text-xl font-bold">
                  {data.today.visits > 0 ? Math.round((data.today.bounces / data.today.visits) * 100) : 0}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Week & Month Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">Last 7 Days</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Page Views</span>
                <span className="font-medium">{data.week.pageviews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unique Visitors</span>
                <span className="font-medium">{data.week.visitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">{data.week.visits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bounce Rate</span>
                <span className="font-medium">
                  {data.week.visits > 0 ? Math.round((data.week.bounces / data.week.visits) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <h4 className="text-sm font-medium mb-2">This Month</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Page Views</span>
                <span className="font-medium">{data.month.pageviews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Unique Visitors</span>
                <span className="font-medium">{data.month.visitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sessions</span>
                <span className="font-medium">{data.month.visits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bounce Rate</span>
                <span className="font-medium">
                  {data.month.visits > 0 ? Math.round((data.month.bounces / data.month.visits) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Last 7 Days</h4>
          <div className="h-48">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={35} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="pageViews" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Page Views" />
                  <Bar dataKey="sessions" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No data available yet
              </div>
            )}
          </div>
        </div>

        {/* Top Pages */}
        {data.topPages && data.topPages.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Top Pages (Last 7 Days)</h4>
            <div className="space-y-2">
              {data.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1.5 border-b last:border-0">
                  <span className="truncate max-w-[70%] text-muted-foreground">{page.x}</span>
                  <span className="font-medium">{page.y.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;

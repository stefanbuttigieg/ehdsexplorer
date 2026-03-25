import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { format, subDays, subMonths, startOfDay, startOfMonth } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, Eye, Clock, Activity, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";

interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
}

interface PageviewData { x: string; y: number; }
interface TopPage { x: string; y: number; }

interface AnalyticsResponse {
  configured: boolean;
  error?: string;
  today: UmamiStats;
  week: UmamiStats;
  month: UmamiStats;
  custom: UmamiStats;
  activeVisitors: number;
  pageviewsChart: PageviewData[];
  sessionsChart: PageviewData[];
  topPages: TopPage[];
}

type DatePreset = "today" | "7d" | "30d" | "90d" | "this_month" | "custom";

const presetLabels: Record<DatePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  this_month: "This month",
  custom: "Custom range",
};

const AnalyticsWidget = () => {
  const [preset, setPreset] = useState<DatePreset>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>(subDays(new Date(), 7));
  const [customTo, setCustomTo] = useState<Date | undefined>(new Date());

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (preset) {
      case "today": return { startAt: startOfDay(now).getTime(), endAt: now.getTime() };
      case "7d": return { startAt: subDays(now, 7).getTime(), endAt: now.getTime() };
      case "30d": return { startAt: subDays(now, 30).getTime(), endAt: now.getTime() };
      case "90d": return { startAt: subMonths(now, 3).getTime(), endAt: now.getTime() };
      case "this_month": return { startAt: startOfMonth(now).getTime(), endAt: now.getTime() };
      case "custom": return {
        startAt: (customFrom ?? subDays(now, 7)).getTime(),
        endAt: (customTo ?? now).getTime(),
      };
    }
  }, [preset, customFrom, customTo]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["umami-analytics", dateRange.startAt, dateRange.endAt],
    queryFn: async (): Promise<AnalyticsResponse> => {
      const { data, error } = await supabase.functions.invoke("get-umami-analytics", {
        body: { startAt: dateRange.startAt, endAt: dateRange.endAt },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
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

  // Use the custom range stats for the selected period
  const stats = data?.custom;

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
          <p className="text-muted-foreground text-sm">Unable to load analytics data.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Retry</Button>
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
              <li>Sign up at <a href="https://cloud.umami.is" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cloud.umami.is</a></li>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            <CardDescription>Powered by Umami Analytics</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={preset} onValueChange={(v) => setPreset(v as DatePreset)}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(presetLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>

        {/* Custom date pickers */}
        {preset === "custom" && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <Calendar className="h-3 w-3 mr-1" />
                  {customFrom ? format(customFrom, "MMM dd, yyyy") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={customFrom} onSelect={setCustomFrom} disabled={(date) => date > new Date()} />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <Calendar className="h-3 w-3 mr-1" />
                  {customTo ? format(customTo, "MMM dd, yyyy") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent mode="single" selected={customTo} onSelect={setCustomTo} disabled={(date) => date > new Date()} />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Selected Period Stats */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">{presetLabels[preset]}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { icon: Eye, label: "Views", value: stats?.pageviews },
              { icon: Users, label: "Visitors", value: stats?.visitors },
              { icon: Activity, label: "Sessions", value: stats?.visits },
              { icon: Clock, label: "Avg Time", value: stats && stats.visits > 0 ? formatTime(stats.totaltime / stats.visits) : "0s", raw: true },
              { icon: TrendingUp, label: "Bounce", value: stats && stats.visits > 0 ? `${Math.round((stats.bounces / stats.visits) * 100)}%` : "0%", raw: true },
            ].map(({ icon: Icon, label, value, raw }) => (
              <div key={label} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </div>
                {isLoading ? (
                  <Skeleton className="h-7 w-14" />
                ) : (
                  <p className="text-xl font-bold">{raw ? value : (value as number)?.toLocaleString() ?? 0}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Traffic Overview</h4>
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
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Top Pages</h4>
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

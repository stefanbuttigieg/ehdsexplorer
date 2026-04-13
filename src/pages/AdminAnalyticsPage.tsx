import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminPageLayout, AdminPageLoading } from "@/components/admin/AdminPageLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Globe, Monitor, Smartphone, Users, Eye, Activity, TrendingUp, ArrowUpRight, Clock, MousePointer } from "lucide-react";

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "month", label: "This month" },
];

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#14b8a6", "#f97316",
];

function getDateRange(range: string) {
  const now = new Date();
  const end = now.getTime();
  let start: number;
  switch (range) {
    case "today": {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      start = s.getTime();
      break;
    }
    case "7d": start = end - 7 * 86400000; break;
    case "30d": start = end - 30 * 86400000; break;
    case "90d": start = end - 90 * 86400000; break;
    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      start = s.getTime();
      break;
    }
    default: start = end - 7 * 86400000;
  }
  return { startAt: start, endAt: end };
}

function formatDate(range: string) {
  const { startAt, endAt } = getDateRange(range);
  return {
    startDate: new Date(startAt).toISOString().split("T")[0],
    endDate: new Date(endAt).toISOString().split("T")[0],
  };
}

function StatCard({ title, value, icon: Icon, subtitle }: { title: string; value: string | number; icon: any; subtitle?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground/30" />
        </div>
      </CardContent>
    </Card>
  );
}

function MetricsTable({ data, nameLabel = "Name", valueLabel = "Views" }: { data: any[]; nameLabel?: string; valueLabel?: string }) {
  if (!data?.length) return <p className="text-sm text-muted-foreground py-4">No data available</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{nameLabel}</TableHead>
          <TableHead className="text-right">{valueLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item: any, i: number) => (
          <TableRow key={i}>
            <TableCell className="text-sm">{item.x || item.name || "—"}</TableCell>
            <TableCell className="text-right font-medium">{item.y ?? item.count ?? 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminAnalyticsPage() {
  const { loading, shouldRender } = useAdminGuard({ requireSuperAdmin: true });
  const [range, setRange] = useState("7d");

  const { startAt, endAt } = getDateRange(range);
  const { startDate, endDate } = formatDate(range);

  const { data: umami, isLoading: umamiLoading } = useQuery({
    queryKey: ["admin-analytics-umami", range],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-umami-analytics", {
        method: "POST",
        body: { startAt, endAt },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  const { data: posthog, isLoading: posthogLoading } = useQuery({
    queryKey: ["admin-analytics-posthog", range],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-posthog-analytics", {
        method: "POST",
        body: { startDate, endDate },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

  if (loading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  const umamiConfigured = umami?.configured !== false;
  const posthogConfigured = posthog?.configured !== false;

  const pageviewsChart = (umami?.pageviewsChart ?? []).map((item: any) => ({
    date: item.x ? new Date(item.x).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
    pageviews: item.y ?? 0,
  }));

  const sessionsChart = (umami?.sessionsChart ?? []).map((item: any) => ({
    date: item.x ? new Date(item.x).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
    sessions: item.y ?? 0,
  }));

  // Combine charts
  const combinedChart = pageviewsChart.map((p: any, i: number) => ({
    ...p,
    sessions: sessionsChart[i]?.sessions ?? 0,
  }));

  const pieData = (umami?.devices ?? []).map((d: any) => ({
    name: d.x || "Unknown",
    value: d.y || 0,
  }));

  const countriesData = (umami?.countries ?? []).map((c: any) => ({
    name: c.x || "Unknown",
    value: c.y || 0,
  }));

  const posthogTrendChart = posthog?.trends?.pageviews
    ? (posthog.trends.pageviews.labels || []).map((label: string, i: number) => ({
        date: label,
        pageviews: posthog.trends.pageviews.data?.[i] ?? 0,
        pageLeaves: posthog.trends.pageLeaves?.data?.[i] ?? 0,
      }))
    : [];

  return (
    <AdminPageLayout
      title="Analytics Dashboard"
      description="Unified analytics from Umami and PostHog"
      backTo="/admin"
      actions={
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANGE_OPTIONS.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="posthog">PostHog</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {!umamiConfigured && (
            <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">Umami is not configured.</p></CardContent></Card>
          )}
          {umamiConfigured && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard title="Active Now" value={umami?.activeVisitors ?? 0} icon={Activity} />
                <StatCard title="Pageviews" value={(umami?.custom?.pageviews ?? 0).toLocaleString()} icon={Eye} />
                <StatCard title="Visitors" value={(umami?.custom?.visitors ?? 0).toLocaleString()} icon={Users} />
                <StatCard title="Visits" value={(umami?.custom?.visits ?? 0).toLocaleString()} icon={TrendingUp} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatCard title="Today" value={(umami?.today?.pageviews ?? 0).toLocaleString()} icon={Eye} subtitle="pageviews" />
                <StatCard title="This Week" value={(umami?.week?.pageviews ?? 0).toLocaleString()} icon={Eye} subtitle="pageviews" />
                <StatCard title="This Month" value={(umami?.month?.pageviews ?? 0).toLocaleString()} icon={Eye} subtitle="pageviews" />
              </div>

              {combinedChart.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Pageviews & Sessions</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={combinedChart}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pageviews" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* GEOGRAPHY TAB */}
        <TabsContent value="geography" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-4 w-4" />Top Countries</CardTitle></CardHeader>
              <CardContent>
                {countriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={countriesData.slice(0, 15)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" fontSize={12} />
                      <YAxis type="category" dataKey="name" fontSize={12} width={50} />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">All Countries</CardTitle></CardHeader>
              <CardContent className="max-h-[350px] overflow-y-auto">
                <MetricsTable data={umami?.countries ?? []} nameLabel="Country" valueLabel="Visits" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Languages</CardTitle></CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto">
              <MetricsTable data={umami?.languages ?? []} nameLabel="Language" valueLabel="Visits" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TECHNOLOGY TAB */}
        <TabsContent value="technology" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Smartphone className="h-4 w-4" />Devices</CardTitle></CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                        {pieData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground">No data</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Monitor className="h-4 w-4" />Browsers</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                <MetricsTable data={umami?.browsers ?? []} nameLabel="Browser" valueLabel="Visits" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Operating Systems</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                <MetricsTable data={umami?.os ?? []} nameLabel="OS" valueLabel="Visits" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Eye className="h-4 w-4" />Top Pages</CardTitle></CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                <MetricsTable data={umami?.topPages ?? []} nameLabel="URL" valueLabel="Views" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ArrowUpRight className="h-4 w-4" />Referrers</CardTitle></CardHeader>
              <CardContent className="max-h-[400px] overflow-y-auto">
                <MetricsTable data={umami?.referrers ?? []} nameLabel="Source" valueLabel="Visits" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MousePointer className="h-4 w-4" />Custom Events</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                <MetricsTable data={umami?.events ?? []} nameLabel="Event" valueLabel="Count" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Query Parameters</CardTitle></CardHeader>
              <CardContent className="max-h-[300px] overflow-y-auto">
                <MetricsTable data={umami?.queryParams ?? []} nameLabel="Parameter" valueLabel="Count" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* POSTHOG TAB */}
        <TabsContent value="posthog" className="space-y-4">
          {!posthogConfigured && (
            <Card><CardContent className="py-4"><p className="text-sm text-muted-foreground">PostHog is not configured. Add a POSTHOG_PERSONAL_API_KEY secret.</p></CardContent></Card>
          )}
          {posthogConfigured && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <StatCard
                  title="Pageviews"
                  value={(posthog?.trends?.pageviews?.count ?? 0).toLocaleString()}
                  icon={Eye}
                  subtitle="in range"
                />
                <StatCard
                  title="Page Leaves"
                  value={(posthog?.trends?.pageLeaves?.count ?? 0).toLocaleString()}
                  icon={TrendingUp}
                  subtitle="in range"
                />
                <StatCard
                  title="Total Persons"
                  value={(posthog?.totalPersons ?? 0).toLocaleString()}
                  icon={Users}
                  subtitle="all time"
                />
              </div>

              {posthogTrendChart.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">PostHog Pageview Trends</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={posthogTrendChart}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" fontSize={11} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pageviews" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Pageviews" />
                        <Line type="monotone" dataKey="pageLeaves" stroke="#ef4444" strokeWidth={2} dot={false} name="Page Leaves" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><MousePointer className="h-4 w-4" />Top Events</CardTitle></CardHeader>
                <CardContent>
                  {posthog?.topEvents?.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={posthog.topEvents.slice(0, 10)}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="name" fontSize={11} angle={-30} textAnchor="end" height={80} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-muted-foreground">No event data in this range</p>}
                </CardContent>
              </Card>
            </>
          )}

          {posthogLoading && <p className="text-sm text-muted-foreground">Loading PostHog data...</p>}
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

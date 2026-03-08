import { useState, useMemo } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useApiLogs, ApiLogWithDetails } from "@/hooks/useApiLogs";
import { useApiKeys, ApiKeyWithProfile } from "@/hooks/useApiKeys";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { RefreshCw, Key, Activity, AlertTriangle, CheckCircle, XCircle, Eye, Clock, Globe, Download, Search, BarChart3, TrendingUp, Filter } from "lucide-react";
import { format, formatDistanceToNow, subDays, subHours, isAfter } from "date-fns";

// -- Subcomponents --

function StatsCards({ stats }: { stats: { requestsLast24h: number; requestsLastWeek: number; errorsLast24h: number } | undefined }) {
  if (!stats) return null;
  const errorRate = stats.requestsLast24h > 0 
    ? ((stats.errorsLast24h / stats.requestsLast24h) * 100).toFixed(1) 
    : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Requests (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.requestsLast24h}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Requests (7 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.requestsLastWeek}</div>
          <p className="text-xs text-muted-foreground mt-1">
            ~{Math.round(stats.requestsLastWeek / 7)}/day avg
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Errors (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.errorsLast24h}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Error Rate (24h)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{errorRate}%</div>
        </CardContent>
      </Card>
    </div>
  );
}

function getStatusBadge(statusCode: number) {
  if (statusCode >= 200 && statusCode < 300) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
  } else if (statusCode >= 400 && statusCode < 500) {
    return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
  } else if (statusCode >= 500) {
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
  }
  return <Badge variant="outline">{statusCode}</Badge>;
}

function getKeyStatusBadge(key: ApiKeyWithProfile) {
  if (!key.is_active) {
    return <Badge variant="destructive">Revoked</Badge>;
  }
  if (key.expires_at && new Date(key.expires_at) < new Date()) {
    return <Badge variant="secondary">Expired</Badge>;
  }
  return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>;
}

function exportLogsCSV(logs: ApiLogWithDetails[]) {
  const headers = ["Time", "User", "Key", "Endpoint", "Method", "Country", "Status", "Message", "IP"];
  const rows = logs.map(log => [
    format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
    log.profile?.display_name || log.profile?.email || "Unknown",
    log.api_key ? `${log.api_key.key_prefix}...` : "JWT",
    log.endpoint,
    log.method,
    log.country_code || "",
    String(log.status_code),
    log.response_message || "",
    log.ip_address || "",
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `api-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportKeysCSV(keys: ApiKeyWithProfile[]) {
  const headers = ["Name", "User", "Key Prefix", "Countries", "Status", "Last Used", "Created"];
  const rows = keys.map(key => [
    key.name,
    key.profile?.display_name || key.profile?.email || "Unknown",
    key.key_prefix,
    key.country_codes.join("; "),
    !key.is_active ? "Revoked" : (key.expires_at && new Date(key.expires_at) < new Date()) ? "Expired" : "Active",
    key.last_used_at ? format(new Date(key.last_used_at), "yyyy-MM-dd HH:mm") : "Never",
    format(new Date(key.created_at), "yyyy-MM-dd"),
  ]);

  const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `api-keys-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function LogDetailDialog({ log, onClose }: { log: ApiLogWithDetails | null; onClose: () => void }) {
  return (
    <Dialog open={!!log} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>
            {log && format(new Date(log.created_at), 'PPpp')}
          </DialogDescription>
        </DialogHeader>
        {log && (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                  <p className="font-mono text-sm">{log.endpoint}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Method</p>
                  <p className="font-mono text-sm">{log.method}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(log.status_code)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country</p>
                  <p>{log.country_code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p>{log.profile?.display_name || log.profile?.email || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">API Key</p>
                  <p>{log.api_key ? `${log.api_key.name} (${log.api_key.key_prefix}...)` : 'JWT Auth'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="font-mono text-sm">{log.ip_address || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Obligation ID</p>
                  <p className="font-mono text-sm">{log.obligation_id || '-'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Response Message</p>
                <p className="text-sm bg-muted p-2 rounded">{log.response_message || '-'}</p>
              </div>
              
              {log.request_body && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Request Body</p>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {JSON.stringify(log.request_body, null, 2)}
                  </pre>
                </div>
              )}
              
              {log.user_agent && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                  <p className="text-xs text-muted-foreground break-all">{log.user_agent}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LogsAnalytics({ logs }: { logs: ApiLogWithDetails[] }) {
  const analytics = useMemo(() => {
    const endpointCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};

    logs.forEach(log => {
      endpointCounts[log.endpoint] = (endpointCounts[log.endpoint] || 0) + 1;
      if (log.country_code) {
        countryCounts[log.country_code] = (countryCounts[log.country_code] || 0) + 1;
      }
      const statusGroup = log.status_code >= 500 ? "5xx" : log.status_code >= 400 ? "4xx" : log.status_code >= 300 ? "3xx" : "2xx";
      statusCounts[statusGroup] = (statusCounts[statusGroup] || 0) + 1;
      const hour = new Date(log.created_at).getHours();
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const topCountries = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    const peakHour = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    return { topEndpoints, topCountries, statusCounts, peakHour };
  }, [logs]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analytics.topEndpoints.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            analytics.topEndpoints.map(([endpoint, count]) => (
              <div key={endpoint} className="flex justify-between items-center text-sm">
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[200px]">{endpoint}</code>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Top Countries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analytics.topCountries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            analytics.topCountries.map(([country, count]) => (
              <div key={country} className="flex justify-between items-center text-sm">
                <Badge variant="outline" className="gap-1">
                  <Globe className="h-3 w-3" />
                  {country}
                </Badge>
                <span className="text-muted-foreground">{count} requests</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(analytics.statusCounts).map(([status, count]) => (
            <div key={status} className="flex justify-between items-center text-sm">
              <span className={
                status === "2xx" ? "text-green-600" :
                status === "4xx" ? "text-amber-600" :
                status === "5xx" ? "text-red-600" : "text-muted-foreground"
              }>{status}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      status === "2xx" ? "bg-green-500" :
                      status === "4xx" ? "bg-amber-500" :
                      status === "5xx" ? "bg-red-500" : "bg-muted-foreground"
                    }`}
                    style={{ width: `${Math.min(100, (count / logs.length) * 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
          {analytics.peakHour && (
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Peak hour: {analytics.peakHour[0]}:00 ({analytics.peakHour[1]} requests)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// -- Main Page --

const AdminApiLogsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ApiLogWithDetails | null>(null);
  
  const { logs, isLoading: logsLoading, refetch, stats } = useApiLogs({
    statusCode: statusFilter !== "all" ? parseInt(statusFilter) : undefined,
    limit: 500,
  });
  
  const { allKeys, allKeysLoading } = useApiKeys();

  // Client-side filtering for search and time range
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Time range filter
    if (timeRange !== "all") {
      const now = new Date();
      const cutoff = timeRange === "1h" ? subHours(now, 1)
        : timeRange === "6h" ? subHours(now, 6)
        : timeRange === "24h" ? subDays(now, 1)
        : timeRange === "7d" ? subDays(now, 7)
        : new Date(0);

      result = result.filter(log => isAfter(new Date(log.created_at), cutoff));
    }

    // Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.endpoint?.toLowerCase().includes(q) ||
        log.country_code?.toLowerCase().includes(q) ||
        log.response_message?.toLowerCase().includes(q) ||
        log.profile?.display_name?.toLowerCase().includes(q) ||
        log.profile?.email?.toLowerCase().includes(q) ||
        log.ip_address?.includes(q) ||
        log.api_key?.name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, searchQuery, timeRange]);

  return (
    <AdminPageLayout
      title="API Keys & Logs"
      description="Manage API keys, view request logs, and analyze usage patterns"
    >
      <div className="space-y-6">
        <StatsCards stats={stats} />

        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Request Logs
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-4 space-y-0 pb-4">
                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Request Logs</CardTitle>
                    <CardDescription>
                      {filteredLogs.length} of {logs.length} requests shown
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => exportLogsCSV(filteredLogs)}>
                      <Download className="h-3.5 w-3.5" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search endpoint, user, country, IP..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="200">Success (2xx)</SelectItem>
                      <SelectItem value="400">Client Error (4xx)</SelectItem>
                      <SelectItem value="500">Server Error (5xx)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[130px]">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="1h">Last hour</SelectItem>
                      <SelectItem value="6h">Last 6 hours</SelectItem>
                      <SelectItem value="24h">Last 24 hours</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Endpoint</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Message</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Loading logs...
                          </TableCell>
                        </TableRow>
                      ) : filteredLogs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {searchQuery || statusFilter !== "all" || timeRange !== "all"
                              ? "No logs match your filters"
                              : "No API logs found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.profile?.display_name || log.profile?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {log.api_key ? (
                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.api_key.key_prefix}...</code>
                              ) : (
                                <span className="text-muted-foreground text-xs">JWT</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.endpoint}</code>
                            </TableCell>
                            <TableCell>
                              {log.country_code ? (
                                <Badge variant="outline" className="gap-1">
                                  <Globe className="h-3 w-3" />
                                  {log.country_code}
                                </Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell>{getStatusBadge(log.status_code)}</TableCell>
                            <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                              {log.response_message}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => setSelectedLog(log)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-4 space-y-4">
            <LogsAnalytics logs={filteredLogs} />
          </TabsContent>

          <TabsContent value="keys" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>All API Keys</CardTitle>
                  <CardDescription>API keys generated by country managers</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => exportKeysCSV(allKeys)}>
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Key Prefix</TableHead>
                        <TableHead>Countries</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Last Used</TableHead>
                        <TableHead className="hidden lg:table-cell">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allKeysLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading keys...
                          </TableCell>
                        </TableRow>
                      ) : allKeys.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No API keys have been created
                          </TableCell>
                        </TableRow>
                      ) : (
                        allKeys.map((key) => (
                          <TableRow key={key.id}>
                            <TableCell className="font-medium">{key.name}</TableCell>
                            <TableCell>
                              {key.profile?.display_name || key.profile?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{key.key_prefix}...</code>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {key.country_codes.slice(0, 3).map((code) => (
                                  <Badge key={code} variant="outline" className="text-xs">{code}</Badge>
                                ))}
                                {key.country_codes.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{key.country_codes.length - 3}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{getKeyStatusBadge(key)}</TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                              {key.last_used_at 
                                ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true })
                                : 'Never'}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                              {format(new Date(key.created_at), 'MMM d, yyyy')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <LogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </AdminPageLayout>
  );
};

export default AdminApiLogsPage;

import { useState } from "react";
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
import { RefreshCw, Key, Activity, AlertTriangle, CheckCircle, XCircle, Eye, Clock, Globe } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const AdminApiLogsPage = () => {
  const { isSuperAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ApiLogWithDetails | null>(null);
  
  const { logs, isLoading: logsLoading, refetch, stats } = useApiLogs({
    statusCode: statusFilter !== "all" ? parseInt(statusFilter) : undefined,
    limit: 200,
  });
  
  const { allKeys, allKeysLoading } = useApiKeys();

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"><AlertTriangle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
    } else if (statusCode >= 500) {
      return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />{statusCode}</Badge>;
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  const getKeyStatusBadge = (key: ApiKeyWithProfile) => {
    if (!key.is_active) {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</Badge>;
  };

  return (
    <AdminPageLayout
      title="API Keys & Logs"
      description="Manage API keys and view request logs"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requests (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.requestsLast24h}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Requests (7 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.requestsLastWeek}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Errors (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.errorsLast24h}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="logs">
          <TabsList>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Request Logs
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle>Request Logs</CardTitle>
                  <CardDescription>Recent API requests from country managers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="200">Success (2xx)</SelectItem>
                      <SelectItem value="400">Client Error (4xx)</SelectItem>
                      <SelectItem value="500">Server Error (5xx)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => refetch()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
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
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Message</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsLoading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            Loading logs...
                          </TableCell>
                        </TableRow>
                      ) : logs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No API logs found
                          </TableCell>
                        </TableRow>
                      ) : (
                        logs.map((log) => (
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

          <TabsContent value="keys" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>All API Keys</CardTitle>
                <CardDescription>API keys generated by country managers</CardDescription>
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

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                    <p className="font-mono text-sm">{selectedLog.endpoint}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Method</p>
                    <p className="font-mono text-sm">{selectedLog.method}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {getStatusBadge(selectedLog.status_code)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Country</p>
                    <p>{selectedLog.country_code || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User</p>
                    <p>{selectedLog.profile?.display_name || selectedLog.profile?.email || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">API Key</p>
                    <p>{selectedLog.api_key ? `${selectedLog.api_key.name} (${selectedLog.api_key.key_prefix}...)` : 'JWT Auth'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                    <p className="font-mono text-sm">{selectedLog.ip_address || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Obligation ID</p>
                    <p className="font-mono text-sm">{selectedLog.obligation_id || '-'}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Response Message</p>
                  <p className="text-sm bg-muted p-2 rounded">{selectedLog.response_message || '-'}</p>
                </div>
                
                {selectedLog.request_body && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Request Body</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedLog.request_body, null, 2)}
                    </pre>
                  </div>
                )}
                
                {selectedLog.user_agent && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">User Agent</p>
                    <p className="text-xs text-muted-foreground break-all">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminApiLogsPage;

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import {
  useEhdsiStagingData,
  useEhdsiPublishedData,
  useEhdsiSyncHistory,
  useApproveKpiData,
  useRejectKpiData,
  useTriggerEhdsiSync,
  EhdsiKpiStaging,
} from "@/hooks/useEhdsiKpis";
import { AdminPageLayout, AdminPageLoading } from "@/components/admin/AdminPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

// Removed unused KPI_CATEGORY_COLORS - using Badge variant="outline" instead

const AdminEhdsiKpisPage = () => {
  const { user } = useAuth();
  const { isLoading: authLoading, shouldRender } = useAdminGuard();

  const { data: pendingData, isLoading: pendingLoading } = useEhdsiStagingData("pending");
  const { data: publishedData, isLoading: publishedLoading } = useEhdsiPublishedData();
  const { data: syncHistory, isLoading: historyLoading } = useEhdsiSyncHistory();

  const approveKpi = useApproveKpiData();
  const rejectKpi = useRejectKpiData();
  const triggerSync = useTriggerEhdsiSync();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  if (authLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  const handleSelectAll = (checked: boolean) => {
    if (checked && pendingData) {
      setSelectedIds(pendingData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleApprove = async () => {
    if (!user?.id || selectedIds.length === 0) return;

    try {
      await approveKpi.mutateAsync({ stagingIds: selectedIds, userId: user.id });
      toast.success(`Approved ${selectedIds.length} KPI records`);
      setSelectedIds([]);
    } catch (error: any) {
      toast.error(error.message || "Failed to approve records");
    }
  };

  const handleReject = async () => {
    if (!user?.id || selectedIds.length === 0) return;

    try {
      await rejectKpi.mutateAsync({
        stagingIds: selectedIds,
        userId: user.id,
        notes: rejectNotes,
      });
      toast.success(`Rejected ${selectedIds.length} KPI records`);
      setSelectedIds([]);
      setRejectDialogOpen(false);
      setRejectNotes("");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject records");
    }
  };

  const handleSync = async () => {
    try {
      const result = await triggerSync.mutateAsync();
      toast.success(result.message || "Sync completed");
    } catch (error: any) {
      toast.error(error.message || "Sync failed");
    }
  };

  const formatValue = (value: number | null, unit: string | null) => {
    if (value === null) return "-";
    if (unit === "percentage") return `${value.toFixed(1)}%`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toLocaleString();
  };

  return (
    <AdminPageLayout
      title="eHDSI KPI Data"
      description="Sync and manage MyHealth@EU implementation metrics from the EU eHDSI portal"
      backTo="/admin"
      actions={
        <Button onClick={handleSync} disabled={triggerSync.isPending}>
          {triggerSync.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Sync from eHDSI
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingData?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                Published KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{publishedData?.length || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Countries Covered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {new Set(publishedData?.map((d) => d.country_code) || []).size}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending Review
              {(pendingData?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingData?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published">Published Data</TabsTrigger>
            <TabsTrigger value="history">Sync History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending KPI Data</CardTitle>
                {selectedIds.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleApprove}
                      disabled={approveKpi.isPending}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve ({selectedIds.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectDialogOpen(true)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject ({selectedIds.length})
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !pendingData?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    No pending KPI data. Click "Sync from eHDSI" to fetch new data.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedIds.length === pendingData.length}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>KPI</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(row.id)}
                              onCheckedChange={(c) =>
                                handleSelectOne(row.id, c as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.country_name}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{row.kpi_id}</span>
                            <p className="text-xs text-muted-foreground">
                              {row.kpi_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.kpi_category.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatValue(row.value, row.unit)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.reference_date || "-"}
                          </TableCell>
                          <TableCell>
                            {row.source_url && (
                              <a
                                href={row.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="published" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Published KPI Data</CardTitle>
              </CardHeader>
              <CardContent>
                {publishedLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !publishedData?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    No published KPI data yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>KPI</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Approved</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {publishedData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">
                            {row.country_name}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{row.kpi_id}</span>
                            <p className="text-xs text-muted-foreground">
                              {row.kpi_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {row.kpi_category.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono">
                            {formatValue(row.value, row.unit)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.reference_date || "-"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(row.approved_at), "MMM d, yyyy")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !syncHistory?.length ? (
                  <p className="text-center text-muted-foreground py-8">
                    No sync history yet.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Started</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Triggered By</TableHead>
                        <TableHead>Fetched</TableHead>
                        <TableHead>New</TableHead>
                        <TableHead>Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncHistory.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="text-sm">
                            {format(new Date(row.started_at), "MMM d, HH:mm")}
                          </TableCell>
                          <TableCell>
                            {row.status === "completed" ? (
                              <Badge variant="default">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            ) : row.status === "failed" ? (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Running
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">
                            {row.triggered_by}
                          </TableCell>
                          <TableCell>{row.records_fetched}</TableCell>
                          <TableCell>{row.records_new}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {row.completed_at
                              ? `${Math.round(
                                  (new Date(row.completed_at).getTime() -
                                    new Date(row.started_at).getTime()) /
                                    1000
                                )}s`
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject KPI Data</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject {selectedIds.length} record(s)?
              You can add notes explaining why.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Optional: Add rejection notes..."
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject}>Reject</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
};

export default AdminEhdsiKpisPage;

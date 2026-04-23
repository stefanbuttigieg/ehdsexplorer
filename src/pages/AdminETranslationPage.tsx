import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Languages,
  Loader2,
  RefreshCw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  useSubmitETranslation,
  useTranslationJobs,
  useTranslationJob,
  type TranslationJob,
} from "@/hooks/useETranslation";

const EU_LANGUAGES = [
  "BG","CS","DA","DE","EL","EN","ES","ET","FI","FR","GA","HR","HU","IT",
  "LT","LV","MT","NL","PL","PT","RO","SK","SL","SV",
];

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <Badge variant="outline" className="border-success/40 text-success gap-1">
        <CheckCircle2 className="h-3 w-3" /> Completed
      </Badge>
    );
  }
  if (status === "failed") {
    return (
      <Badge variant="outline" className="border-destructive/40 text-destructive gap-1">
        <XCircle className="h-3 w-3" /> Failed
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" /> Pending
    </Badge>
  );
}

export default function AdminETranslationPage() {
  const { data: jobs, refetch, isFetching } = useTranslationJobs(100);
  const submit = useSubmitETranslation();

  const [text, setText] = useState(
    "The European Health Data Space is a key initiative."
  );
  const [sourceLang, setSourceLang] = useState("EN");
  const [targetLang, setTargetLang] = useState("FR");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [detailJob, setDetailJob] = useState<TranslationJob | null>(null);

  // Live-poll the active job created from the test panel
  const { data: activeJob } = useTranslationJob(activeJobId);

  const stats = useMemo(() => {
    const list = jobs ?? [];
    const byStatus = { pending: 0, completed: 0, failed: 0 };
    for (const j of list) {
      if (j.status === "completed") byStatus.completed++;
      else if (j.status === "failed") byStatus.failed++;
      else byStatus.pending++;
    }
    const completedJobs = list.filter(
      (j) => j.status === "completed" && j.completed_at
    );
    let avgMs = 0;
    if (completedJobs.length) {
      const total = completedJobs.reduce((sum, j) => {
        const a = new Date(j.created_at).getTime();
        const b = new Date(j.completed_at!).getTime();
        return sum + Math.max(0, b - a);
      }, 0);
      avgMs = total / completedJobs.length;
    }
    return { total: list.length, ...byStatus, avgMs };
  }, [jobs]);

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error("Enter some text to translate");
      return;
    }
    try {
      const res = await submit.mutateAsync({
        text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        targetType: "snippet",
        metadata: { source: "admin_test" },
      });
      setActiveJobId(res.jobId);
      toast.success("Submitted to eTranslation. Awaiting EC callback…");
      refetch();
    } catch {
      // toast handled in hook
    }
  };

  const formatDuration = (ms: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
    return `${(ms / 60000).toFixed(1)} min`;
  };

  return (
    <AdminPageLayout
      title="eTranslation (EC)"
      description="European Commission eTranslation API monitoring and test console."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total jobs</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-2xl text-success">
              {stats.completed}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg turnaround</CardDescription>
            <CardTitle className="text-2xl">{formatDuration(stats.avgMs)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Test console */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" /> Test console
          </CardTitle>
          <CardDescription>
            Send a snippet directly to the European Commission eTranslation API. The job
            arrives asynchronously via the registered callback URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Source language</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    {EU_LANGUAGES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target language</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-64">
                    {EU_LANGUAGES.filter((c) => c !== sourceLang).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Source text (max 5000 chars)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {text.length} / 5000
            </p>
          </div>
          <Button onClick={handleSubmit} disabled={submit.isPending} className="gap-2">
            {submit.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Languages className="h-4 w-4" />
            )}
            Submit test translation
          </Button>

          {activeJob && (
            <div className="rounded-md border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono">{activeJob.id}</span>
                <StatusBadge status={activeJob.status} />
              </div>
              {activeJob.status === "pending" && (
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Waiting for EC callback…
                </p>
              )}
              {activeJob.status === "completed" && activeJob.translated_text && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {activeJob.target_language} translation
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {activeJob.translated_text}
                  </p>
                </div>
              )}
              {activeJob.status === "failed" && (
                <p className="text-xs text-destructive">
                  {activeJob.error_message || "Failed"}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent translation jobs</CardTitle>
          <CardDescription>
            Last {jobs?.length ?? 0} jobs submitted to the EC eTranslation service.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Lang</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(jobs ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      No translation jobs yet.
                    </TableCell>
                  </TableRow>
                )}
                {(jobs ?? []).map((j) => (
                  <TableRow key={j.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(j.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {j.source_language} → {j.target_language}
                    </TableCell>
                    <TableCell className="text-xs">{j.target_type}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs">
                      {j.source_text}
                    </TableCell>
                    <TableCell><StatusBadge status={j.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailJob(j)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailJob} onOpenChange={(o) => !o && setDetailJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Translation job</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {detailJob?.id}
            </DialogDescription>
          </DialogHeader>
          {detailJob && (
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <StatusBadge status={detailJob.status} />
                <span className="text-xs text-muted-foreground">
                  {detailJob.source_language} → {detailJob.target_language}
                </span>
              </div>
              <div>
                <Label className="text-xs">Source text</Label>
                <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
                  {detailJob.source_text}
                </div>
              </div>
              {detailJob.translated_text && (
                <div>
                  <Label className="text-xs">Translation</Label>
                  <div className="rounded-md border bg-muted/30 p-3 whitespace-pre-wrap text-sm">
                    {detailJob.translated_text}
                  </div>
                </div>
              )}
              {detailJob.error_message && (
                <div>
                  <Label className="text-xs text-destructive">Error</Label>
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    {detailJob.error_message}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <Label className="text-xs">Target type</Label>
                  <p>{detailJob.target_type}</p>
                </div>
                <div>
                  <Label className="text-xs">Target id</Label>
                  <p className="font-mono">{detailJob.target_id ?? "—"}</p>
                </div>
                <div>
                  <Label className="text-xs">Created</Label>
                  <p>{new Date(detailJob.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-xs">Completed</Label>
                  <p>
                    {detailJob.completed_at
                      ? new Date(detailJob.completed_at).toLocaleString()
                      : "—"}
                  </p>
                </div>
              </div>
              {detailJob.metadata && Object.keys(detailJob.metadata).length > 0 && (
                <div>
                  <Label className="text-xs">Metadata</Label>
                  <pre className="rounded-md border bg-muted/30 p-3 text-xs overflow-x-auto">
                    {JSON.stringify(detailJob.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}
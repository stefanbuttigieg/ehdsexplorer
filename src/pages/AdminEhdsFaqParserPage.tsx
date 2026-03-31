import { useState } from "react";
import { RefreshCw, Download, AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useEhdsFaqSyncLogs } from "@/hooks/useEhdsFaqs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const DEFAULT_PDF_URL = "https://health.ec.europa.eu/document/download/39129f32-710e-412c-89d2-52f9a1f81900_en?filename=ehealth_ehds_qa_en.pdf";

const AdminEhdsFaqParserPage = () => {
  const { data: syncLogs = [], isLoading: logsLoading } = useEhdsFaqSyncLogs();
  const [pdfUrl, setPdfUrl] = useState(DEFAULT_PDF_URL);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const triggerSync = async (dryRun = false) => {
    if (dryRun) setIsDryRun(true);
    else setIsSyncing(true);
    setDryRunResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("parse-ehds-faq", {
        body: { pdf_url: pdfUrl, dry_run: dryRun, force: true },
      });

      if (error) throw error;

      if (dryRun && data?.faqs) {
        setDryRunResult(data);
        toast({ title: "Preview ready", description: `Found ${data.faqs.length} FAQs` });
      } else {
        toast({
          title: "Sync complete",
          description: `Parsed ${data?.faqs_parsed || 0} FAQs and ${data?.footnotes_parsed || 0} footnotes`,
        });
        queryClient.invalidateQueries({ queryKey: ["ehds-faqs"] });
        queryClient.invalidateQueries({ queryKey: ["ehds-faq-sync-logs"] });
      }
    } catch (err: any) {
      toast({
        title: "Sync failed",
        description: err?.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
      setIsDryRun(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error": return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "no_change": return <Clock className="h-4 w-4 text-muted-foreground" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <AdminPageLayout
      title="EHDS FAQ Parser"
      description="Import and sync official EU Commission FAQs from the EHDS Q&A PDF"
    >
      <div className="space-y-6">
        {/* Sync Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">PDF Source</CardTitle>
            <CardDescription>
              Enter the URL of the EHDS FAQ PDF or use the default EU Commission source.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="PDF URL..."
              className="text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => triggerSync(false)} disabled={isSyncing || isDryRun}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
              <Button variant="outline" onClick={() => triggerSync(true)} disabled={isSyncing || isDryRun}>
                <Download className={`h-4 w-4 mr-2 ${isDryRun ? "animate-spin" : ""}`} />
                {isDryRun ? "Previewing..." : "Preview (Dry Run)"}
              </Button>
              <Button variant="outline" onClick={() => setPdfUrl(DEFAULT_PDF_URL)}>
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dry Run Preview */}
        {dryRunResult && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview Results</CardTitle>
              <CardDescription>
                {dryRunResult.faqs?.length || 0} FAQs and {dryRunResult.footnotes?.length || 0} footnotes found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {(dryRunResult.faqs || []).map((faq: any, i: number) => (
                  <div key={i} className="p-2 rounded bg-muted text-sm">
                    <span className="font-mono text-primary">#{faq.faq_number}</span>{" "}
                    <span className="font-medium">{faq.question}</span>
                    <div className="text-xs text-muted-foreground mt-1">
                      {faq.chapter} {faq.sub_category ? `› ${faq.sub_category}` : ""}
                      {faq.source_articles?.length > 0 && ` • Articles: ${faq.source_articles.join(", ")}`}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sync Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync History</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : syncLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sync history yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>FAQs</TableHead>
                      <TableHead>Footnotes</TableHead>
                      <TableHead className="hidden md:table-cell">Hash</TableHead>
                      <TableHead className="hidden md:table-cell">Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {syncLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusIcon(log.status)}
                            <Badge variant={log.status === "success" ? "default" : log.status === "error" ? "destructive" : "secondary"}>
                              {log.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{format(new Date(log.created_at), "dd MMM yyyy HH:mm")}</TableCell>
                        <TableCell>{log.faqs_parsed ?? "-"}</TableCell>
                        <TableCell>{log.footnotes_parsed ?? "-"}</TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{log.pdf_hash?.substring(0, 12) || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-destructive max-w-48 truncate">{log.error_message || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminEhdsFaqParserPage;

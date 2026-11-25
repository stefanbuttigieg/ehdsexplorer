import { useState } from "react";
import { FileUp, Loader2, Merge } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { extractMarkdownTables, columnKeys, mergeTables, type ExtractedTable } from "@/lib/pdf-table-extract";

interface Candidate extends ExtractedTable { selected: boolean; name: string }

export function PdfTableImportDialog({ actId, open, onOpenChange, startOrder }: {
  actId: string; open: boolean; onOpenChange: (v: boolean) => void; startOrder: number;
}) {
  const [busy, setBusy] = useState<"read" | "import" | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [fileName, setFileName] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const reset = () => { setCandidates([]); setFileName(""); };

  const readPdf = async (file: File) => {
    setBusy("read"); setCandidates([]); setFileName(file.name);
    const path = `${crypto.randomUUID()}.pdf`;
    try {
      const { error: upErr } = await supabase.storage.from("temp-pdf-imports")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("temp-pdf-imports").getPublicUrl(path);
      const { data, error } = await supabase.functions.invoke("parse-implementing-act-pdf", { body: { pdfUrl: pub.publicUrl } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Could not read the PDF");
      const found = extractMarkdownTables(data.content as string);
      if (found.length === 0) {
        toast({ title: "No tables found", description: "The PDF text did not contain any recognisable tables.", variant: "destructive" });
      }
      setCandidates(found.map((t, i) => ({ ...t, selected: true, name: (t.context || `Table ${i + 1}`).slice(0, 120) })));
    } catch (e: any) {
      toast({ title: "PDF reading failed", description: e.message, variant: "destructive" });
    } finally {
      supabase.storage.from("temp-pdf-imports").remove([path]).catch(() => {});
      setBusy(null);
    }
  };

  const importSelected = async () => {
    const chosen = candidates.filter((c) => c.selected && c.name.trim());
    if (!chosen.length) return;
    setBusy("import");
    try {
      for (const [n, c] of chosen.entries()) {
        const { data: table, error } = await supabase.from("implementing_act_data_tables")
          .insert({ implementing_act_id: actId, name: c.name.trim(), description: `Imported from ${fileName}`, sort_order: startOrder + n, is_published: false })
          .select("id").single();
        if (error) throw error;
        const keys = columnKeys(c.headers);
        const { error: colErr } = await supabase.from("implementing_act_data_columns")
          .insert(c.headers.map((h, i) => ({ table_id: table.id, name: h, column_key: keys[i], sort_order: i })));
        if (colErr) throw colErr;
        const { error: rowErr } = await supabase.from("implementing_act_data_rows").insert(
          c.rows.map((r, i) => ({ table_id: table.id, sort_order: i, values: Object.fromEntries(keys.map((k, j) => [k, r[j] ?? ""])) })),
        );
        if (rowErr) throw rowErr;
      }
      qc.invalidateQueries({ queryKey: ["ia-data-tables", actId] });
      toast({ title: `Imported ${chosen.length} table${chosen.length > 1 ? "s" : ""}`, description: "They are hidden until you publish them." });
      reset(); onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  const joined = candidates.filter((c) => c.selected);
  const joinSelected = () => {
    const idx = candidates.map((c, i) => (c.selected ? i : -1)).filter((i) => i >= 0);
    if (idx.length < 2) return;
    const merged = { ...mergeTables(idx.map((i) => candidates[i])), selected: true, name: candidates[idx[0]].name };
    setCandidates((cs) => cs.flatMap((c, i) => (i === idx[0] ? [merged] : idx.includes(i) ? [] : [c])));
    toast({ title: `Joined ${idx.length} tables`, description: "Rows follow page order under the first table's columns." });
  };
  const joinWithPrevious = (i: number) => {
    const merged = { ...mergeTables([candidates[i - 1], candidates[i]]), selected: true, name: candidates[i - 1].name };
    setCandidates((cs) => cs.flatMap((c, j) => (j === i - 1 ? [merged] : j === i ? [] : [c])));
  };

  const update = (i: number, patch: Partial<Candidate>) =>
    setCandidates((cs) => cs.map((c, j) => (j === i ? { ...c, ...patch } : c)));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileUp className="h-5 w-5" /> Import tables from PDF</DialogTitle>
          <DialogDescription>Upload the implementing act or annex PDF. Pick the tables to keep, name them, and check the preview before importing.</DialogDescription>
        </DialogHeader>

        <Input type="file" accept="application/pdf" disabled={!!busy}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) readPdf(f); e.target.value = ""; }} />
        {busy === "read" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Reading {fileName}… this can take a minute.</p>}

        {candidates.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted p-3 text-sm">
            <span>Table split across pages? Tick the parts and join them, or use "Join with above".</span>
            <Button size="sm" variant="secondary" disabled={!!busy || joined.length < 2} onClick={joinSelected}>
              <Merge className="h-4 w-4 mr-1" /> Join {joined.length >= 2 ? joined.length : ""} ticked tables
            </Button>
          </div>
        )}
        <div className="space-y-4">
          {candidates.map((c, i) => (
            <div key={i} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox checked={c.selected} onCheckedChange={(v) => update(i, { selected: !!v })} aria-label={`Import table ${i + 1}`} />
                <Input value={c.name} onChange={(e) => update(i, { name: e.target.value })} aria-label="Table name" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{c.headers.length} cols · {c.rows.length} rows</span>
                {i > 0 && (
                  <Button size="sm" variant="outline" disabled={!!busy} onClick={() => joinWithPrevious(i)} title="Add these rows to the end of the table above">
                    <Merge className="h-4 w-4 mr-1" /> Join with above
                  </Button>
                )}
              </div>
              <div className="overflow-x-auto max-h-56">
                <Table>
                  <TableHeader><TableRow>{c.headers.map((h, j) => <TableHead key={j} className="text-xs">{h}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>
                    {c.rows.slice(0, 5).map((r, j) => (
                      <TableRow key={j}>{r.map((v, k) => <TableCell key={k} className="text-xs py-1">{v}</TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
                {c.rows.length > 5 && <p className="text-xs text-muted-foreground mt-1">…and {c.rows.length - 5} more rows</p>}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={!!busy} onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
          <Button disabled={!!busy || !candidates.some((c) => c.selected && c.name.trim())} onClick={importSelected}>
            {busy === "import" && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Import {candidates.filter((c) => c.selected).length || ""} table(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

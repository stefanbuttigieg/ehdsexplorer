import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Pencil, Trash2, ExternalLink, Upload, Plus, History, Table as TableIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import MarkdownEditor from "@/components/MarkdownEditor";
import { useAllEhdsFaqs, useEhdsFaqVersions, type EhdsFaq, type EhdsFaqVersion } from "@/hooks/useEhdsFaqs";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

const AdminEhdsFaqsPage = () => {
  const { data: faqs = [], isLoading } = useAllEhdsFaqs();
  const { data: versions = [] } = useEhdsFaqVersions();
  const [search, setSearch] = useState("");
  const [editingFaq, setEditingFaq] = useState<EhdsFaq | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const filtered = faqs.filter(f => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q) ||
      f.chapter.toLowerCase().includes(q) ||
      String(f.faq_number) === q
    );
  });

  const filteredIds = filtered.map(f => f.id);
  const bulk = useBulkSelection<string>(filteredIds);

  const togglePublished = async (faq: EhdsFaq) => {
    const { error } = await supabase
      .from("ehds_faqs")
      .update({ is_published: !faq.is_published })
      .eq("id", faq.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs-all"] });
      toast({ title: faq.is_published ? "Unpublished" : "Published" });
    }
  };

  const saveFaq = async (updated: Partial<EhdsFaq>) => {
    if (!editingFaq) return;
    const { error } = await supabase
      .from("ehds_faqs")
      .update({
        question: updated.question,
        answer: updated.answer,
        rich_content: updated.rich_content,
        chapter: updated.chapter,
        sub_category: updated.sub_category,
        source_references: updated.source_references,
        source_articles: updated.source_articles,
        source_recitals: updated.source_recitals,
        document_version: updated.document_version,
      })
      .eq("id", editingFaq.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs-all"] });
      toast({ title: "FAQ updated" });
      setEditingFaq(null);
    }
  };

  const deleteFaq = async () => {
    if (!deletingId) return;
    const { error } = await supabase.from("ehds_faqs").delete().eq("id", deletingId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs"] });
      queryClient.invalidateQueries({ queryKey: ["ehds-faqs-all"] });
      toast({ title: "FAQ deleted" });
    }
    setDeletingId(null);
  };

  const chapters = [...new Set(faqs.map(f => f.chapter))];
  const publishedCount = faqs.filter(f => f.is_published).length;

  return (
    <AdminPageLayout
      title="EHDS FAQs"
      description={`Manage the ${faqs.length} official EU Commission EHDS FAQs (${publishedCount} published)`}
    >
      <div className="space-y-4">
        {/* Action bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by question, chapter, or number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {bulk.selectedCount > 0 && (
              <>
                <Button variant="default" size="sm" onClick={() => setShowBulkEdit(true)}>
                  Bulk Edit ({bulk.selectedCount})
                </Button>
                <Button variant="outline" size="sm" onClick={bulk.clearSelection}>
                  Clear
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowVersionDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Versions
            </Button>
            <Link to="/admin/faq-data-tables">
              <Button variant="outline" size="sm">
                <TableIcon className="h-4 w-4 mr-2" />
                Data Tables
              </Button>
            </Link>
            <Link to="/admin/ehds-faq-parser">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                PDF Parser
              </Button>
            </Link>
            <Link to="/faqs" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Chapter summary */}
        <div className="flex flex-wrap gap-1.5">
          {chapters.map(ch => (
            <Badge key={ch} variant="secondary" className="text-xs cursor-pointer" onClick={() => setSearch(ch)}>
              {ch} ({faqs.filter(f => f.chapter === ch).length})
            </Badge>
          ))}
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {search ? "No FAQs match your search." : "No EHDS FAQs imported yet. Use the PDF Parser to import."}
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={bulk.isAllSelected}
                      onCheckedChange={bulk.toggleAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="hidden md:table-cell">Chapter</TableHead>
                  <TableHead className="hidden lg:table-cell">Articles</TableHead>
                  <TableHead className="hidden lg:table-cell">Version</TableHead>
                  <TableHead className="w-20">Published</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(faq => (
                  <TableRow key={faq.id} data-state={bulk.isSelected(faq.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={bulk.isSelected(faq.id)}
                        onCheckedChange={() => bulk.toggle(faq.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{faq.faq_number}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm line-clamp-2">{faq.question}</p>
                      {!faq.rich_content && (
                        <Badge variant="outline" className="text-xs mt-1 border-amber-300 dark:border-amber-600 text-amber-600 dark:text-amber-400">No rich content</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{faq.chapter}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(faq.source_articles || []).slice(0, 3).map(a => (
                          <Badge key={a} variant="secondary" className="text-xs">Art. {a}</Badge>
                        ))}
                        {(faq.source_articles || []).length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{(faq.source_articles || []).length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{faq.document_version || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={faq.is_published}
                        onCheckedChange={() => togglePublished(faq)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingFaq(faq)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeletingId(faq.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditFaqDialog key={editingFaq?.id || "none"} faq={editingFaq} onClose={() => setEditingFaq(null)} onSave={saveFaq} />

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete FAQ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently delete this FAQ and its footnotes.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteFaq}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={showVersionDialog}
        onClose={() => setShowVersionDialog(false)}
        versions={versions}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditDialog
        open={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        selectedIds={bulk.selectedArray}
        versions={versions}
        chapters={chapters}
        onDone={() => {
          bulk.clearSelection();
          queryClient.invalidateQueries({ queryKey: ["ehds-faqs"] });
          queryClient.invalidateQueries({ queryKey: ["ehds-faqs-all"] });
        }}
      />
    </AdminPageLayout>
  );
};

/* ── Bulk Edit Dialog ── */
function BulkEditDialog({ open, onClose, selectedIds, versions, chapters, onDone }: {
  open: boolean;
  onClose: () => void;
  selectedIds: string[];
  versions: EhdsFaqVersion[];
  chapters: string[];
  onDone: () => void;
}) {
  const [field, setField] = useState("document_version");
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const applyBulkEdit = async () => {
    if (selectedIds.length === 0 || !value) return;
    setSaving(true);

    let updatePayload: Record<string, unknown> = {};
    if (field === "document_version") {
      updatePayload = { document_version: value };
    } else if (field === "chapter") {
      updatePayload = { chapter: value };
    } else if (field === "is_published") {
      updatePayload = { is_published: value === "true" };
    } else if (field === "sub_category") {
      updatePayload = { sub_category: value || null };
    }

    const { error } = await supabase
      .from("ehds_faqs")
      .update(updatePayload)
      .in("id", selectedIds);

    setSaving(false);
    if (error) {
      toast({ title: "Bulk update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Updated ${selectedIds.length} FAQs` });
      onDone();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Edit {selectedIds.length} FAQs</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Field to update</Label>
            <Select value={field} onValueChange={(v) => { setField(v); setValue(""); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document_version">Document Version</SelectItem>
                <SelectItem value="chapter">Chapter</SelectItem>
                <SelectItem value="is_published">Published Status</SelectItem>
                <SelectItem value="sub_category">Sub-category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>New value</Label>
            {field === "document_version" ? (
              versions.length > 0 ? (
                <Select value={value} onValueChange={setValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select version..." />
                  </SelectTrigger>
                  <SelectContent>
                    {versions.map(v => (
                      <SelectItem key={v.id} value={v.version_label}>{v.version_label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={value} onChange={e => setValue(e.target.value)} placeholder="e.g. v2.0 - March 2025" />
              )
            ) : field === "chapter" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chapter..." />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map(ch => (
                    <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field === "is_published" ? (
              <Select value={value} onValueChange={setValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Published</SelectItem>
                  <SelectItem value="false">Unpublished</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input value={value} onChange={e => setValue(e.target.value)} placeholder="Sub-category value..." />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={applyBulkEdit} disabled={!value || saving}>
            {saving ? "Updating..." : `Update ${selectedIds.length} FAQs`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditFaqDialog({ faq, onClose, onSave }: {
  faq: EhdsFaq | null;
  onClose: () => void;
  onSave: (data: Partial<EhdsFaq>) => void;
}) {
  const [form, setForm] = useState<Partial<EhdsFaq> & { _rawArticles?: string; _rawRecitals?: string }>({});

  useEffect(() => {
    if (faq) {
      setForm({
        question: faq.question,
        answer: faq.answer,
        rich_content: faq.rich_content || "",
        chapter: faq.chapter,
        sub_category: faq.sub_category || "",
        source_references: faq.source_references || "",
        source_articles: faq.source_articles || [],
        source_recitals: faq.source_recitals || [],
        document_version: faq.document_version || "",
      });
    } else {
      setForm({});
    }
  }, [faq]);

  const handleClose = () => {
    setForm({});
    onClose();
  };

  return (
    <Dialog open={!!faq} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit FAQ #{faq?.faq_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Textarea value={form.question || ""} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Answer (plain text summary)</Label>
            <Textarea value={form.answer || ""} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label>Rich Content (Markdown with preview)</Label>
            <MarkdownEditor
              value={form.rich_content || ""}
              onChange={(val) => setForm(p => ({ ...p, rich_content: val }))}
              rows={12}
              placeholder="Full FAQ answer in Markdown format..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chapter</Label>
              <Input value={form.chapter || ""} onChange={e => setForm(p => ({ ...p, chapter: e.target.value }))} />
            </div>
            <div>
              <Label>Sub-category</Label>
              <Input value={form.sub_category || ""} onChange={e => setForm(p => ({ ...p, sub_category: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source Articles (comma-separated)</Label>
              <Input
                value={form._rawArticles ?? (form.source_articles || []).join(", ")}
                onChange={e => {
                  const raw = e.target.value;
                  const parsed = raw.split(",").map(s => s.trim()).filter(Boolean);
                  setForm(p => ({ ...p, _rawArticles: raw, source_articles: parsed }));
                }}
                onBlur={() => setForm(p => ({ ...p, _rawArticles: undefined }))}
                placeholder="e.g. 1, 14, 105"
              />
            </div>
            <div>
              <Label>Source Recitals (comma-separated)</Label>
              <Input
                value={form._rawRecitals ?? (form.source_recitals || []).join(", ")}
                onChange={e => {
                  const raw = e.target.value;
                  const parsed = raw.split(",").map(s => s.trim()).filter(Boolean);
                  setForm(p => ({ ...p, _rawRecitals: raw, source_recitals: parsed }));
                }}
                onBlur={() => setForm(p => ({ ...p, _rawRecitals: undefined }))}
                placeholder="e.g. 1, 5, 12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Source References</Label>
              <Input value={form.source_references || ""} onChange={e => setForm(p => ({ ...p, source_references: e.target.value }))} />
            </div>
            <div>
              <Label>Document Version</Label>
              <Input
                value={form.document_version || ""}
                onChange={e => setForm(p => ({ ...p, document_version: e.target.value }))}
                placeholder="e.g. v2.0 - March 2025"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={() => onSave(form)}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VersionHistoryDialog({ open, onClose, versions }: {
  open: boolean;
  onClose: () => void;
  versions: EhdsFaqVersion[];
}) {
  const [newVersion, setNewVersion] = useState({ version_label: "", release_date: "", notes: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addVersion = async () => {
    if (!newVersion.version_label.trim()) return;
    const { error } = await supabase.from("ehds_faq_versions").insert({
      version_label: newVersion.version_label,
      release_date: newVersion.release_date || null,
      notes: newVersion.notes || null,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Version added" });
      queryClient.invalidateQueries({ queryKey: ["ehds-faq-versions"] });
      setNewVersion({ version_label: "", release_date: "", notes: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>FAQ Document Versions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add new version */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">Add Version</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Input
                placeholder="Version label (e.g. v2.0 - March 2025)"
                value={newVersion.version_label}
                onChange={e => setNewVersion(p => ({ ...p, version_label: e.target.value }))}
              />
              <Input
                type="date"
                value={newVersion.release_date}
                onChange={e => setNewVersion(p => ({ ...p, release_date: e.target.value }))}
              />
              <Textarea
                placeholder="Release notes..."
                value={newVersion.notes}
                onChange={e => setNewVersion(p => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
              <Button size="sm" onClick={addVersion} disabled={!newVersion.version_label.trim()}>
                <Plus className="h-4 w-4 mr-1" /> Add Version
              </Button>
            </CardContent>
          </Card>

          {/* Version list */}
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No versions tracked yet.</p>
          ) : (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{v.version_label}</span>
                    {v.release_date && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(v.release_date), "dd MMM yyyy")}
                      </span>
                    )}
                  </div>
                  {v.notes && <p className="text-xs text-muted-foreground mt-1">{v.notes}</p>}
                  {v.faqs_updated_count > 0 && (
                    <Badge variant="secondary" className="text-xs mt-1">{v.faqs_updated_count} FAQs updated</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AdminEhdsFaqsPage;

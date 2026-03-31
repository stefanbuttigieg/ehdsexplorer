import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Eye, EyeOff, Pencil, Trash2, ExternalLink, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { useAllEhdsFaqs, type EhdsFaq } from "@/hooks/useEhdsFaqs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const AdminEhdsFaqsPage = () => {
  const { data: faqs = [], isLoading } = useAllEhdsFaqs();
  const [search, setSearch] = useState("");
  const [editingFaq, setEditingFaq] = useState<EhdsFaq | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
          <div className="flex gap-2">
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
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead className="hidden md:table-cell">Chapter</TableHead>
                  <TableHead className="hidden lg:table-cell">Articles</TableHead>
                  <TableHead className="w-20">Published</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(faq => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-mono text-sm">{faq.faq_number}</TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm line-clamp-2">{faq.question}</p>
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
      <EditFaqDialog faq={editingFaq} onClose={() => setEditingFaq(null)} onSave={saveFaq} />

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
    </AdminPageLayout>
  );
};

function EditFaqDialog({ faq, onClose, onSave }: { faq: EhdsFaq | null; onClose: () => void; onSave: (data: Partial<EhdsFaq>) => void }) {
  const [form, setForm] = useState<Partial<EhdsFaq>>({});

  // Reset form when faq changes
  if (faq && form.question === undefined) {
    setForm({
      question: faq.question,
      answer: faq.answer,
      rich_content: faq.rich_content || "",
      chapter: faq.chapter,
      sub_category: faq.sub_category || "",
      source_references: faq.source_references || "",
      source_articles: faq.source_articles || [],
    });
  }

  const handleClose = () => {
    setForm({});
    onClose();
  };

  return (
    <Dialog open={!!faq} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit FAQ #{faq?.faq_number}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Question</Label>
            <Textarea value={form.question || ""} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} rows={2} />
          </div>
          <div>
            <Label>Answer (plain text)</Label>
            <Textarea value={form.answer || ""} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} rows={3} />
          </div>
          <div>
            <Label>Rich Content (Markdown)</Label>
            <Textarea value={form.rich_content || ""} onChange={e => setForm(p => ({ ...p, rich_content: e.target.value }))} rows={8} className="font-mono text-xs" />
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
          <div>
            <Label>Source References</Label>
            <Input value={form.source_references || ""} onChange={e => setForm(p => ({ ...p, source_references: e.target.value }))} />
          </div>
          <div>
            <Label>Source Articles (comma-separated)</Label>
            <Input
              value={(form.source_articles || []).join(", ")}
              onChange={e => setForm(p => ({ ...p, source_articles: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))}
            />
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

export default AdminEhdsFaqsPage;

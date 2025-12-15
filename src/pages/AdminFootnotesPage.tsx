import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Edit, Trash2, Search, FileText, BookOpen } from "lucide-react";
import { useFootnotes, useCreateFootnote, useUpdateFootnote, useDeleteFootnote, Footnote } from "@/hooks/useFootnotes";
import { useArticles } from "@/hooks/useArticles";
import { useRecitals } from "@/hooks/useRecitals";
import { toast } from "sonner";

const AdminFootnotesPage = () => {
  const navigate = useNavigate();
  const { data: footnotes, isLoading } = useFootnotes();
  const { data: articles } = useArticles();
  const { data: recitals } = useRecitals();
  const createFootnote = useCreateFootnote();
  const updateFootnote = useUpdateFootnote();
  const deleteFootnote = useDeleteFootnote();

  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editingFootnote, setEditingFootnote] = useState<Footnote | null>(null);
  const [formData, setFormData] = useState({
    marker: "",
    content: "",
    parentType: "article" as "article" | "recital",
    parentId: "",
  });

  const filteredFootnotes = footnotes?.filter(
    (fn) =>
      fn.marker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fn.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({ marker: "", content: "", parentType: "article", parentId: "" });
    setEditingFootnote(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setShowDialog(true);
  };

  const openEditDialog = (footnote: Footnote) => {
    setEditingFootnote(footnote);
    setFormData({
      marker: footnote.marker,
      content: footnote.content,
      parentType: footnote.article_id ? "article" : "recital",
      parentId: String(footnote.article_id || footnote.recital_id || ""),
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.marker || !formData.content || !formData.parentId) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      marker: formData.marker,
      content: formData.content,
      article_id: formData.parentType === "article" ? parseInt(formData.parentId) : null,
      recital_id: formData.parentType === "recital" ? parseInt(formData.parentId) : null,
    };

    try {
      if (editingFootnote) {
        await updateFootnote.mutateAsync({ id: editingFootnote.id, ...payload });
        toast.success("Footnote updated successfully");
      } else {
        await createFootnote.mutateAsync(payload);
        toast.success("Footnote created successfully");
      }
      setShowDialog(false);
      resetForm();
    } catch (error) {
      toast.error("Failed to save footnote");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this footnote?")) return;
    try {
      await deleteFootnote.mutateAsync(id);
      toast.success("Footnote deleted successfully");
    } catch (error) {
      toast.error("Failed to delete footnote");
    }
  };

  const getParentLabel = (footnote: Footnote) => {
    if (footnote.article_id) {
      const article = articles?.find((a) => a.id === footnote.article_id);
      return article ? `Article ${article.article_number}` : `Article ID ${footnote.article_id}`;
    }
    if (footnote.recital_id) {
      const recital = recitals?.find((r) => r.id === footnote.recital_id);
      return recital ? `Recital ${recital.recital_number}` : `Recital ID ${footnote.recital_id}`;
    }
    return "Unknown";
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate("/admin")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Footnotes Management
          </CardTitle>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Footnote
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search footnotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading footnotes...</p>
          ) : filteredFootnotes?.length === 0 ? (
            <p className="text-muted-foreground">No footnotes found.</p>
          ) : (
            <div className="space-y-3">
              {filteredFootnotes?.map((footnote) => (
                <div
                  key={footnote.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded text-sm">
                        {footnote.marker}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {footnote.article_id ? (
                          <FileText className="h-3 w-3" />
                        ) : (
                          <BookOpen className="h-3 w-3" />
                        )}
                        {getParentLabel(footnote)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{footnote.content}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="ghost" onClick={() => openEditDialog(footnote)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(footnote.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFootnote ? "Edit Footnote" : "Add Footnote"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="marker">Marker (e.g., [^1], *, †)</Label>
              <Input
                id="marker"
                value={formData.marker}
                onChange={(e) => setFormData({ ...formData, marker: e.target.value })}
                placeholder="[^1]"
              />
            </div>
            <div>
              <Label htmlFor="parentType">Attach to</Label>
              <Select
                value={formData.parentType}
                onValueChange={(value: "article" | "recital") =>
                  setFormData({ ...formData, parentType: value, parentId: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="recital">Recital</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="parentId">
                {formData.parentType === "article" ? "Select Article" : "Select Recital"}
              </Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${formData.parentType}...`} />
                </SelectTrigger>
                <SelectContent>
                  {formData.parentType === "article"
                    ? articles?.map((a) => (
                        <SelectItem key={a.id} value={String(a.id)}>
                          Article {a.article_number}: {a.title}
                        </SelectItem>
                      ))
                    : recitals?.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          Recital {r.recital_number}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Footnote content..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={createFootnote.isPending || updateFootnote.isPending}>
              {editingFootnote ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFootnotesPage;

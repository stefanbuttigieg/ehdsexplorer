import { useState } from "react";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminPageLayout, AdminPageLoading } from "@/components/admin/AdminPageLayout";
import { type DownloadableResource } from "@/hooks/useDownloadableResources";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Upload, ExternalLink } from "lucide-react";

const RESOURCE_TYPES = ["checklist", "template", "guide", "framework", "workbook", "brief"];
const ALL_TAGS = ["compliance", "governance", "technical", "privacy", "cross-border", "startup", "interoperability", "data-governance"];

interface ResourceFormData {
  title: string;
  description: string;
  resource_type: string;
  file_url: string;
  tags: string[];
  is_published: boolean;
  requires_email: boolean;
}

const emptyForm: ResourceFormData = {
  title: "",
  description: "",
  resource_type: "guide",
  file_url: "",
  tags: [],
  is_published: true,
  requires_email: false,
};

export default function AdminResourcesPage() {
  const { shouldRender, loading } = useAdminGuard();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all resources (including unpublished) for admin
  const [allResources, setAllResources] = useState<DownloadableResource[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ResourceFormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all resources including unpublished
  const { data: adminResources = [], isLoading: adminLoading } = useQuery({
    queryKey: ["downloadable-resources-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("downloadable_resources")
        .select("*")
        .order("title");
      if (error) throw error;
      return (data ?? []) as DownloadableResource[];
    },
  });

  if (loading || !shouldRender) return <AdminPageLoading />;

  const filtered = adminResources.filter(
    (r: DownloadableResource) =>
      !searchQuery ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (r: DownloadableResource) => {
    setEditingId(r.id);
    setForm({
      title: r.title,
      description: r.description ?? "",
      resource_type: r.resource_type,
      file_url: r.file_url,
      tags: r.tags ?? [],
      is_published: r.is_published ?? true,
      requires_email: r.requires_email ?? false,
    });
    setDialogOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("resources").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("resources").getPublicUrl(path);
      setForm((f) => ({ ...f, file_url: urlData.publicUrl }));
      toast({ title: "File uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.file_url) {
      toast({ title: "Title and file URL are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        resource_type: form.resource_type,
        file_url: form.file_url,
        tags: form.tags.length ? form.tags : null,
        is_published: form.is_published,
        requires_email: form.requires_email,
      };

      if (editingId) {
        const { error } = await supabase
          .from("downloadable_resources")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast({ title: "Resource updated" });
      } else {
        const { error } = await supabase
          .from("downloadable_resources")
          .insert(payload);
        if (error) throw error;
        toast({ title: "Resource created" });
      }
      queryClient.invalidateQueries({ queryKey: ["downloadable-resources"] });
      queryClient.invalidateQueries({ queryKey: ["downloadable-resources-admin"] });
      setDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    const { error } = await supabase.from("downloadable_resources").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resource deleted" });
      queryClient.invalidateQueries({ queryKey: ["downloadable-resources"] });
      queryClient.invalidateQueries({ queryKey: ["downloadable-resources-admin"] });
    }
  };

  const toggleTag = (tag: string) => {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  };

  return (
    <AdminPageLayout
      title="Downloadable Resources"
      description="Manage compliance templates, checklists, and guides available on the Tools Hub"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search resources..."
      actions={
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Resource
        </Button>
      }
    >
      {adminLoading ? (
        <p>Loading resources...</p>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No resources found. Click "Add Resource" to create one.
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden md:table-cell">Tags</TableHead>
                <TableHead className="hidden sm:table-cell">Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r: DownloadableResource) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="font-medium text-sm">{r.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1 sm:hidden">
                      {r.resource_type} · {r.is_published ? "Published" : "Draft"}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="text-xs">{r.resource_type}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {r.tags?.map((t) => (
                        <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={r.is_published ? "default" : "secondary"}>
                      {r.is_published ? "Yes" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(r.id)}>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Resource" : "Add Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label>Resource Type</Label>
              <Select value={form.resource_type} onValueChange={(v) => setForm((f) => ({ ...f, resource_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>File</Label>
              <div className="flex gap-2 items-center">
                <Input type="file" onChange={handleFileUpload} disabled={uploading} className="flex-1" />
                {uploading && <span className="text-xs text-muted-foreground">Uploading...</span>}
              </div>
              {form.file_url && (
                <a href={form.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 block truncate">
                  {form.file_url}
                </a>
              )}
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">Or paste a URL directly</Label>
                <Input
                  value={form.file_url}
                  onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ALL_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_published: v }))}
                />
                <Label>Published</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.requires_email}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, requires_email: v }))}
                />
                <Label>Requires Email</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}

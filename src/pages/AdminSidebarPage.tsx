import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Eye, EyeOff, Pencil, GripVertical, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import {
  useAllSidebarItems,
  useUpdateSidebarItem,
  useCreateSidebarItem,
  useDeleteSidebarItem,
  SidebarItem,
} from "@/hooks/useSidebarItems";

const ICON_OPTIONS = [
  "Home", "Book", "FileText", "Scale", "Files", "ListChecks", "Globe", "Network",
  "GitCompare", "Heart", "Laptop", "Stethoscope", "Wrench", "Sparkles", "Newspaper",
  "MessageCircleQuestion", "Bookmark", "StickyNote", "Trophy", "Medal", "Brain",
  "HelpCircle", "Code", "Shield", "Cookie", "ScrollText", "Accessibility",
  "Users", "Search", "Settings", "MapPin", "Layers", "BookOpen", "ExternalLink",
];

const SECTION_LABELS: Record<string, string> = {
  main: "Main Navigation",
  utility: "Utility Links",
  legal: "Legal Pages",
};

interface EditFormState {
  label: string;
  path: string;
  icon_name: string;
  section: "main" | "legal" | "utility";
  requires_auth: boolean;
  open_external: boolean;
}

const AdminSidebarPage = () => {
  const { shouldRender, loading: authLoading } = useAdminGuard();
  const { data: items, isLoading } = useAllSidebarItems();
  const updateItem = useUpdateSidebarItem();
  const createItem = useCreateSidebarItem();
  const deleteItem = useDeleteSidebarItem();
  const { toast } = useToast();

  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    label: "", path: "", icon_name: "FileText", section: "main", requires_auth: false, open_external: false,
  });

  if (authLoading || !isAuthorized) return null;

  const sections = ["main", "utility", "legal"];

  const handleToggleVisibility = async (item: SidebarItem) => {
    try {
      await updateItem.mutateAsync({ id: item.id, updates: { is_visible: !item.is_visible } });
      toast({ title: item.is_visible ? "Item hidden" : "Item shown" });
    } catch {
      toast({ title: "Error", description: "Failed to update visibility", variant: "destructive" });
    }
  };

  const handleMoveUp = async (item: SidebarItem, sectionItems: SidebarItem[]) => {
    const idx = sectionItems.findIndex(i => i.id === item.id);
    if (idx <= 0) return;
    const prev = sectionItems[idx - 1];
    await Promise.all([
      updateItem.mutateAsync({ id: item.id, updates: { sort_order: prev.sort_order } }),
      updateItem.mutateAsync({ id: prev.id, updates: { sort_order: item.sort_order } }),
    ]);
  };

  const handleMoveDown = async (item: SidebarItem, sectionItems: SidebarItem[]) => {
    const idx = sectionItems.findIndex(i => i.id === item.id);
    if (idx >= sectionItems.length - 1) return;
    const next = sectionItems[idx + 1];
    await Promise.all([
      updateItem.mutateAsync({ id: item.id, updates: { sort_order: next.sort_order } }),
      updateItem.mutateAsync({ id: next.id, updates: { sort_order: item.sort_order } }),
    ]);
  };

  const openEdit = (item: SidebarItem) => {
    setEditingItem(item);
    setForm({
      label: item.label,
      path: item.path,
      icon_name: item.icon_name,
      section: item.section,
      requires_auth: item.requires_auth,
      open_external: item.open_external,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateItem.mutateAsync({ id: editingItem.id, updates: form });
      toast({ title: "Item updated" });
      setEditingItem(null);
    } catch {
      toast({ title: "Error", description: "Failed to update", variant: "destructive" });
    }
  };

  const handleAdd = async () => {
    if (!form.label || !form.path) return;
    try {
      const maxOrder = (items || []).filter(i => i.section === form.section).reduce((m, i) => Math.max(m, i.sort_order), -1);
      await createItem.mutateAsync({ ...form, sort_order: maxOrder + 1 } as any);
      toast({ title: "Item added" });
      setIsAddDialogOpen(false);
      setForm({ label: "", path: "", icon_name: "FileText", section: "main", requires_auth: false, open_external: false });
    } catch {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sidebar item?")) return;
    try {
      await deleteItem.mutateAsync(id);
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <AdminPageLayout
      title="Sidebar Manager"
      description="Manage the left sidebar navigation items — reorder, show/hide, edit labels, and add new links."
      actions={
        <Button onClick={() => { setIsAddDialogOpen(true); setForm({ label: "", path: "", icon_name: "FileText", section: "main", requires_auth: false, open_external: false }); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      }
    >
      {isLoading ? (
        <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-6">
          {sections.map(section => {
            const sectionItems = (items || []).filter(i => i.section === section);
            if (sectionItems.length === 0) return null;
            return (
              <Card key={section}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{SECTION_LABELS[section]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {sectionItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-accent/30 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{item.label}</span>
                          <Badge variant="outline" className="text-[10px] shrink-0">{item.icon_name}</Badge>
                          {item.open_external && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
                          {item.requires_auth && <Badge variant="secondary" className="text-[10px]">Auth</Badge>}
                        </div>
                        <span className="text-xs text-muted-foreground truncate block">{item.path}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => handleMoveUp(item, sectionItems)}>
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === sectionItems.length - 1} onClick={() => handleMoveDown(item, sectionItems)}>
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleVisibility(item)}>
                          {item.is_visible ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / Add Dialog */}
      <Dialog open={!!editingItem || isAddDialogOpen} onOpenChange={(open) => { if (!open) { setEditingItem(null); setIsAddDialogOpen(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Sidebar Item" : "Add Sidebar Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Navigation label" />
            </div>
            <div className="space-y-1">
              <Label>Path</Label>
              <Input value={form.path} onChange={e => setForm(f => ({ ...f, path: e.target.value }))} placeholder="/my-page" />
            </div>
            <div className="space-y-1">
              <Label>Icon</Label>
              <Select value={form.icon_name} onValueChange={v => setForm(f => ({ ...f, icon_name: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {ICON_OPTIONS.map(ic => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Section</Label>
              <Select value={form.section} onValueChange={v => setForm(f => ({ ...f, section: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main Navigation</SelectItem>
                  <SelectItem value="utility">Utility Links</SelectItem>
                  <SelectItem value="legal">Legal Pages</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.requires_auth} onCheckedChange={v => setForm(f => ({ ...f, requires_auth: v }))} />
                <Label>Requires Auth</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.open_external} onCheckedChange={v => setForm(f => ({ ...f, open_external: v }))} />
                <Label>External Link</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingItem(null); setIsAddDialogOpen(false); }}>Cancel</Button>
            <Button onClick={editingItem ? handleSaveEdit : handleAdd}>
              {editingItem ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminSidebarPage;

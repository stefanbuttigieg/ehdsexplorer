import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useImplementingAct } from '@/hooks/useImplementingActs';
import {
  useImplementingActChanges,
  useCreateActChange,
  useUpdateActChange,
  useDeleteActChange,
  CHANGE_TYPES,
  ImplementingActChange,
} from '@/hooks/useImplementingActChanges';

const emptyForm = {
  change_type: 'modification',
  section_reference: '',
  original_text: '',
  revised_text: '',
  summary: '',
  is_significant: false,
  sort_order: 0,
};

const AdminImplementingActChangesPage = () => {
  const { id } = useParams<{ id: string }>();
  const { shouldRender, loading } = useAdminGuard();
  const { data: act } = useImplementingAct(id || '');
  const { data: changes, isLoading } = useImplementingActChanges(id || null);
  const createMutation = useCreateActChange();
  const updateMutation = useUpdateActChange();
  const deleteMutation = useDeleteActChange();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChange, setEditingChange] = useState<ImplementingActChange | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deletingChange, setDeletingChange] = useState<ImplementingActChange | null>(null);

  if (loading || !shouldRender) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  const openCreate = () => {
    setEditingChange(null);
    setForm({ ...emptyForm, sort_order: (changes?.length || 0) });
    setDialogOpen(true);
  };

  const openEdit = (c: ImplementingActChange) => {
    setEditingChange(c);
    setForm({
      change_type: c.change_type,
      section_reference: c.section_reference || '',
      original_text: c.original_text || '',
      revised_text: c.revised_text || '',
      summary: c.summary,
      is_significant: c.is_significant,
      sort_order: c.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!id || !form.summary.trim()) return;
    const payload = {
      implementing_act_id: id,
      change_type: form.change_type,
      section_reference: form.section_reference || null,
      original_text: form.original_text || null,
      revised_text: form.revised_text || null,
      summary: form.summary,
      is_significant: form.is_significant,
      sort_order: form.sort_order,
    };
    if (editingChange) {
      updateMutation.mutate({ id: editingChange.id, ...payload }, { onSuccess: () => setDialogOpen(false) });
    } else {
      createMutation.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deletingChange || !id) return;
    deleteMutation.mutate(
      { id: deletingChange.id, implementing_act_id: id },
      { onSuccess: () => setDeletingChange(null) },
    );
  };

  const changeTypeColor = (t: string) => {
    switch (t) {
      case 'addition': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'removal': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'modification': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'clarification': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default: return '';
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Link to="/admin/implementing-acts">
              <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-serif">Feedback Changes</h1>
              {act && <p className="text-sm text-muted-foreground line-clamp-1">{act.title}</p>}
            </div>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Change
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : !changes?.length ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No feedback changes recorded yet. Click "Add Change" to start tracking modifications.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {changes.map((c) => (
              <Card key={c.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={changeTypeColor(c.change_type)}>
                          {CHANGE_TYPES.find(t => t.value === c.change_type)?.label || c.change_type}
                        </Badge>
                        {c.is_significant && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Significant
                          </Badge>
                        )}
                        {c.section_reference && (
                          <Badge variant="outline" className="text-xs font-mono">{c.section_reference}</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium">{c.summary}</p>
                      {(c.original_text || c.revised_text) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {c.original_text && (
                            <div className="p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                              <span className="font-semibold text-red-700 dark:text-red-400">Draft:</span>
                              <p className="mt-0.5 line-clamp-3">{c.original_text}</p>
                            </div>
                          )}
                          {c.revised_text && (
                            <div className="p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                              <span className="font-semibold text-green-700 dark:text-green-400">Adopted:</span>
                              <p className="mt-0.5 line-clamp-3">{c.revised_text}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeletingChange(c)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create / Edit dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingChange ? 'Edit Change' : 'Add Feedback Change'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Change Type</Label>
                  <Select value={form.change_type} onValueChange={v => setForm(f => ({ ...f, change_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANGE_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section Reference</Label>
                  <Input
                    value={form.section_reference}
                    onChange={e => setForm(f => ({ ...f, section_reference: e.target.value }))}
                    placeholder="e.g., Art. 6(3)(a)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Summary *</Label>
                <Textarea
                  value={form.summary}
                  onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                  placeholder="Brief description of the change..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Original Draft Text</Label>
                <Textarea
                  value={form.original_text}
                  onChange={e => setForm(f => ({ ...f, original_text: e.target.value }))}
                  placeholder="Text from the draft/feedback version..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Adopted / Revised Text</Label>
                <Textarea
                  value={form.revised_text}
                  onChange={e => setForm(f => ({ ...f, revised_text: e.target.value }))}
                  placeholder="Text from the adopted version..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={form.sort_order}
                    onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch
                    checked={form.is_significant}
                    onCheckedChange={v => setForm(f => ({ ...f, is_significant: v }))}
                  />
                  <Label>Significant change</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending || !form.summary.trim()}
                >
                  <Save className="h-4 w-4 mr-1" />
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation */}
        <AlertDialog open={!!deletingChange} onOpenChange={() => setDeletingChange(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Change</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this change record? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminImplementingActChangesPage;

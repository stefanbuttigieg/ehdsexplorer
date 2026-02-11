import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, GripVertical, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ToolkitOption {
  value: string;
  label: string;
  description?: string;
}

interface ToolkitQuestion {
  id: string;
  question: string;
  description: string | null;
  question_type: string;
  options: ToolkitOption[];
  sort_order: number;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'starter_kit', label: 'Starter Kit' },
  { value: 'readiness', label: 'Readiness Assessment' },
];

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multi Choice' },
];

function emptyQuestion(): Partial<ToolkitQuestion> {
  return {
    id: '',
    question: '',
    description: '',
    question_type: 'single_choice',
    options: [{ value: '', label: '' }],
    sort_order: 0,
    is_active: true,
    category: 'starter_kit',
  };
}

const AdminToolkitQuestionsPage = () => {
  const { shouldRender, loading } = useAdminGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<ToolkitQuestion> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin-toolkit-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('toolkit_questions')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return (data ?? []).map((q) => ({
        ...q,
        options: (q.options as unknown as ToolkitOption[]) ?? [],
      })) as ToolkitQuestion[];
    },
    enabled: shouldRender,
  });

  const saveMutation = useMutation({
    mutationFn: async (q: Partial<ToolkitQuestion>) => {
      const payload = {
        id: q.id!,
        question: q.question!,
        description: q.description || null,
        question_type: q.question_type!,
        options: JSON.parse(JSON.stringify(q.options ?? [])),
        sort_order: q.sort_order ?? 0,
        is_active: q.is_active ?? true,
        category: q.category!,
      };
      if (isNew) {
        const { error } = await supabase.from('toolkit_questions').insert(payload as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('toolkit_questions')
          .update(payload as any)
          .eq('id', q.id!);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-toolkit-questions'] });
      toast({ title: isNew ? 'Question created' : 'Question updated' });
      setDialogOpen(false);
      setEditing(null);
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('toolkit_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-toolkit-questions'] });
      toast({ title: 'Question deleted' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('toolkit_questions').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-toolkit-questions'] }),
  });

  if (loading || isLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  const filtered = filterCategory === 'all'
    ? questions
    : questions.filter((q) => q.category === filterCategory);

  const openNew = () => {
    setIsNew(true);
    setEditing(emptyQuestion());
    setDialogOpen(true);
  };

  const openEdit = (q: ToolkitQuestion) => {
    setIsNew(false);
    setEditing({ ...q });
    setDialogOpen(true);
  };

  const addOption = () => {
    if (!editing) return;
    setEditing({
      ...editing,
      options: [...(editing.options ?? []), { value: '', label: '' }],
    });
  };

  const removeOption = (idx: number) => {
    if (!editing) return;
    setEditing({
      ...editing,
      options: (editing.options ?? []).filter((_, i) => i !== idx),
    });
  };

  const updateOption = (idx: number, field: keyof ToolkitOption, val: string) => {
    if (!editing) return;
    const opts = [...(editing.options ?? [])];
    opts[idx] = { ...opts[idx], [field]: val };
    setEditing({ ...editing, options: opts });
  };

  return (
    <AdminPageLayout
      title="Toolkit Questions"
      description="Manage Starter Kit and Readiness Assessment wizard questions"
      actions={
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openNew} size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Add Question
          </Button>
        </div>
      }
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Question</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="w-24">Type</TableHead>
                <TableHead className="w-20">Options</TableHead>
                <TableHead className="w-20">Active</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="text-muted-foreground">{q.sort_order}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{q.question}</div>
                    {q.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{q.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {CATEGORIES.find((c) => c.value === q.category)?.label ?? q.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{q.question_type === 'single_choice' ? 'Single' : 'Multi'}</TableCell>
                  <TableCell className="text-center">{q.options.length}</TableCell>
                  <TableCell>
                    <Switch
                      checked={q.is_active}
                      onCheckedChange={(v) => toggleActive.mutate({ id: q.id, is_active: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(q)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          if (confirm('Delete this question?')) deleteMutation.mutate(q.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No questions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit / Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? 'Add Question' : 'Edit Question'}</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ID (unique key)</Label>
                  <Input
                    value={editing.id ?? ''}
                    onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                    placeholder="e.g. q-org-type"
                    disabled={!isNew}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    value={editing.sort_order ?? 0}
                    onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Question</Label>
                <Input
                  value={editing.question ?? ''}
                  onChange={(e) => setEditing({ ...editing, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editing.category ?? 'starter_kit'}
                    onValueChange={(v) => setEditing({ ...editing, category: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Question Type</Label>
                  <Select
                    value={editing.question_type ?? 'single_choice'}
                    onValueChange={(v) => setEditing({ ...editing, question_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUESTION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Options editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button variant="outline" size="sm" onClick={addOption} className="gap-1">
                    <Plus className="h-3 w-3" /> Add Option
                  </Button>
                </div>
                <div className="space-y-3">
                  {(editing.options ?? []).map((opt, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Value (e.g. ehr_manufacturer)"
                            value={opt.value}
                            onChange={(e) => updateOption(idx, 'value', e.target.value)}
                          />
                          <Input
                            placeholder="Label (displayed text)"
                            value={opt.label}
                            onChange={(e) => updateOption(idx, 'label', e.target.value)}
                          />
                        </div>
                        <Input
                          placeholder="Description (optional)"
                          value={opt.description ?? ''}
                          onChange={(e) => updateOption(idx, 'description', e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive flex-shrink-0"
                        onClick={() => removeOption(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => editing && saveMutation.mutate(editing)}
              disabled={saveMutation.isPending || !editing?.id || !editing?.question}
            >
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminToolkitQuestionsPage;

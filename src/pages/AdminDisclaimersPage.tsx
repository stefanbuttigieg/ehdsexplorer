import { useState } from 'react';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAllDisclaimers, useUpsertDisclaimer, useDeleteDisclaimer, SiteDisclaimer } from '@/hooks/useDisclaimers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEMENT_OPTIONS = [
  { value: 'implementation_tracker', label: 'Overview — Implementation Tab' },
  { value: 'country_map_implementation', label: 'Country Map — Implementation Tab' },
];

export default function AdminDisclaimersPage() {
  const { isLoading: isChecking } = useAdminGuard();
  const { data: disclaimers, isLoading } = useAllDisclaimers();
  const upsert = useUpsertDisclaimer();
  const remove = useDeleteDisclaimer();
  const [editing, setEditing] = useState<Partial<SiteDisclaimer> | null>(null);

  if (isChecking || isLoading) return <AdminPageLoading />;

  const openNew = () => setEditing({
    id: '',
    title: '',
    message: '',
    variant: 'warning',
    is_active: true,
    placement: [],
  });

  const save = () => {
    if (!editing?.id || !editing.title || !editing.message) return;
    upsert.mutate(editing as SiteDisclaimer, { onSuccess: () => setEditing(null) });
  };

  return (
    <AdminPageLayout
      title="Disclaimers"
      description="Manage disclaimer banners shown across the site"
      actions={
        <Button onClick={openNew} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add Disclaimer
        </Button>
      }
    >
      <div className="space-y-3">
        {disclaimers?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No disclaimers configured yet.</p>
        )}
        {disclaimers?.map(d => (
          <Card key={d.id}>
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{d.title}</span>
                  <Badge variant={d.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {d.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{d.variant}</Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{d.message}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.placement.map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px]">
                      {PLACEMENT_OPTIONS.find(o => o.value === p)?.label || p}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({ ...d })}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove.mutate(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.created_at ? 'Edit Disclaimer' : 'New Disclaimer'}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>ID (unique key)</Label>
                <Input
                  value={editing.id || ''}
                  onChange={e => setEditing({ ...editing, id: e.target.value })}
                  placeholder="e.g. implementation-data-update"
                  disabled={!!editing.created_at}
                />
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  value={editing.title || ''}
                  onChange={e => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={editing.message || ''}
                  onChange={e => setEditing({ ...editing, message: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Variant</Label>
                <Select value={editing.variant || 'warning'} onValueChange={v => setEditing({ ...editing, variant: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warning">Warning (amber)</SelectItem>
                    <SelectItem value="info">Info (blue)</SelectItem>
                    <SelectItem value="error">Error (red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Placement</Label>
                <div className="space-y-2 mt-1">
                  {PLACEMENT_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={editing.placement?.includes(opt.value) || false}
                        onChange={e => {
                          const placements = editing.placement || [];
                          setEditing({
                            ...editing,
                            placement: e.target.checked
                              ? [...placements, opt.value]
                              : placements.filter(p => p !== opt.value),
                          });
                        }}
                        className="rounded"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_active ?? true}
                  onCheckedChange={v => setEditing({ ...editing, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!editing?.id || !editing?.title || !editing?.message}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}

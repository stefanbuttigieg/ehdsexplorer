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
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLACEMENT_GROUPS = [
  {
    label: 'Main Pages',
    options: [
      { value: 'home', label: 'Home Page' },
      { value: 'articles', label: 'Articles List' },
      { value: 'recitals', label: 'Recitals List' },
      { value: 'definitions', label: 'Definitions Page' },
      { value: 'implementing_acts', label: 'Implementing Acts List' },
      { value: 'annexes', label: 'Annexes Page' },
      { value: 'news', label: 'News Page' },
    ],
  },
  {
    label: 'Audience Pages',
    options: [
      { value: 'for_citizens', label: 'For Citizens' },
      { value: 'for_healthcare', label: 'For Healthcare Professionals' },
      { value: 'for_healthtech', label: 'For Health Tech' },
    ],
  },
  {
    label: 'Tools & Features',
    options: [
      { value: 'health_authorities', label: 'Health Authorities' },
      { value: 'cross_regulation', label: 'Cross-Regulation Map' },
      { value: 'games', label: 'Games Hub' },
      { value: 'tools', label: 'Tools Hub' },
      { value: 'implementation_tracker', label: 'Overview — Implementation Tab' },
      { value: 'country_map_implementation', label: 'Country Map — Implementation Tab' },
    ],
  },
  {
    label: 'Special',
    options: [
      { value: 'global', label: '🌐 All Pages (Global Banner)' },
    ],
  },
];

const ALL_PLACEMENT_OPTIONS = PLACEMENT_GROUPS.flatMap(g => g.options);

function PlacementLabel({ value }: { value: string }) {
  const opt = ALL_PLACEMENT_OPTIONS.find(o => o.value === value);
  return <>{opt?.label || value}</>;
}

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

  const togglePlacement = (val: string) => {
    if (!editing) return;
    const placements = editing.placement || [];
    setEditing({
      ...editing,
      placement: placements.includes(val)
        ? placements.filter(p => p !== val)
        : [...placements, val],
    });
  };

  const removePlacement = (val: string) => {
    if (!editing) return;
    setEditing({
      ...editing,
      placement: (editing.placement || []).filter(p => p !== val),
    });
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
                      <PlacementLabel value={p} />
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

              {/* Placement Section */}
              <div>
                <Label>Where to show this disclaimer</Label>

                {/* Selected placements as removable badges */}
                {(editing.placement?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                    {editing.placement!.map(p => (
                      <Badge key={p} variant="default" className="gap-1 pr-1">
                        <PlacementLabel value={p} />
                        <button
                          type="button"
                          onClick={() => removePlacement(p)}
                          className="ml-0.5 rounded-full hover:bg-primary-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Grouped checkboxes */}
                <div className="border rounded-md max-h-56 overflow-y-auto">
                  {PLACEMENT_GROUPS.map(group => (
                    <div key={group.label}>
                      <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0">
                        {group.label}
                      </div>
                      {group.options.map(opt => (
                        <label
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-accent/50 transition-colors",
                            editing.placement?.includes(opt.value) && "bg-accent/30"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={editing.placement?.includes(opt.value) || false}
                            onChange={() => togglePlacement(opt.value)}
                            className="rounded"
                          />
                          {opt.label}
                        </label>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Custom placement input */}
                <div className="mt-3">
                  <Label className="text-xs text-muted-foreground">
                    Target a specific page (e.g. implementing_act:art-92-1)
                  </Label>
                  <Input
                    placeholder="implementing_act:art-92-1 then press Enter"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (val && !editing.placement?.includes(val)) {
                          setEditing({ ...editing, placement: [...(editing.placement || []), val] });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                    className="mt-1"
                  />
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

import { useState, useMemo } from 'react';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAllDisclaimers, useUpsertDisclaimer, useDeleteDisclaimer, SiteDisclaimer } from '@/hooks/useDisclaimers';
import { useImplementingActs } from '@/hooks/useImplementingActs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Plus, Pencil, Trash2, X, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlacementOption {
  value: string;
  label: string;
  group: string;
}

const STATIC_PLACEMENTS: PlacementOption[] = [
  // Special
  { value: 'global', label: '🌐 All Pages (Global Banner)', group: 'Special' },
  // Main Pages
  { value: 'home', label: 'Home Page', group: 'Main Pages' },
  { value: 'articles', label: 'Articles List', group: 'Main Pages' },
  { value: 'recitals', label: 'Recitals List', group: 'Main Pages' },
  { value: 'definitions', label: 'Definitions Page', group: 'Main Pages' },
  { value: 'implementing_acts', label: 'Implementing Acts List', group: 'Main Pages' },
  { value: 'annexes', label: 'Annexes Page', group: 'Main Pages' },
  { value: 'news', label: 'News Page', group: 'Main Pages' },
  // Audience
  { value: 'for_citizens', label: 'For Citizens', group: 'Audience Pages' },
  { value: 'for_healthcare', label: 'For Healthcare Professionals', group: 'Audience Pages' },
  { value: 'for_healthtech', label: 'For Health Tech', group: 'Audience Pages' },
  // Tools & Features
  { value: 'health_authorities', label: 'Health Authorities', group: 'Tools & Features' },
  { value: 'cross_regulation', label: 'Cross-Regulation Map', group: 'Tools & Features' },
  { value: 'games', label: 'Games Hub', group: 'Tools & Features' },
  { value: 'tools', label: 'Tools Hub', group: 'Tools & Features' },
  { value: 'implementation_tracker', label: 'Overview — Implementation Tab', group: 'Tools & Features' },
  { value: 'country_map_implementation', label: 'Country Map — Implementation Tab', group: 'Tools & Features' },
];

function PlacementLabel({ value, allOptions }: { value: string; allOptions: PlacementOption[] }) {
  const opt = allOptions.find(o => o.value === value);
  return <>{opt?.label || value}</>;
}

export default function AdminDisclaimersPage() {
  const { isLoading: isChecking } = useAdminGuard();
  const { data: disclaimers, isLoading } = useAllDisclaimers();
  const { data: implementingActs } = useImplementingActs();
  const upsert = useUpsertDisclaimer();
  const remove = useDeleteDisclaimer();
  const [editing, setEditing] = useState<Partial<SiteDisclaimer> | null>(null);
  const [placementPickerOpen, setPlacementPickerOpen] = useState(false);

  // Build full placement options including dynamic implementing acts
  const allPlacementOptions = useMemo(() => {
    const dynamicOptions: PlacementOption[] = (implementingActs || []).map(act => ({
      value: `implementing_act:${act.id}`,
      label: `Implementing Act: ${act.title}`,
      group: 'Specific Implementing Acts',
    }));
    return [...STATIC_PLACEMENTS, ...dynamicOptions];
  }, [implementingActs]);

  // Group options for display
  const groupedOptions = useMemo(() => {
    const groups: Record<string, PlacementOption[]> = {};
    for (const opt of allPlacementOptions) {
      if (!groups[opt.group]) groups[opt.group] = [];
      groups[opt.group].push(opt);
    }
    return groups;
  }, [allPlacementOptions]);

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
                      <PlacementLabel value={p} allOptions={allPlacementOptions} />
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

              {/* Placement Section — Searchable multi-select */}
              <div>
                <Label>Where to show this disclaimer</Label>

                {/* Selected placements */}
                {(editing.placement?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {editing.placement!.map(p => (
                      <Badge key={p} variant="default" className="gap-1 pr-1">
                        <PlacementLabel value={p} allOptions={allPlacementOptions} />
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

                {/* Searchable dropdown */}
                <Popover open={placementPickerOpen} onOpenChange={setPlacementPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-2 font-normal"
                    >
                      Search and select pages…
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search pages…" />
                      <CommandList className="max-h-64">
                        <CommandEmpty>No pages found.</CommandEmpty>
                        {Object.entries(groupedOptions).map(([group, options]) => (
                          <CommandGroup key={group} heading={group}>
                            {options.map(opt => {
                              const isSelected = editing.placement?.includes(opt.value) || false;
                              return (
                                <CommandItem
                                  key={opt.value}
                                  value={`${opt.label} ${opt.value}`}
                                  onSelect={() => togglePlacement(opt.value)}
                                  className="cursor-pointer"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />
                                  {opt.label}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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

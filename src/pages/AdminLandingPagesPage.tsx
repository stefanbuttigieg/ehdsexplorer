import { useState } from 'react';
import { Plus, Pencil, Trash2, Heart, Laptop, Stethoscope, ChevronDown, ChevronRight } from 'lucide-react';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  useCitizenRights,
  useCitizenRightMutations,
  useHealthtechCategories,
  useHealthtechCategoryMutations,
  useHealthtechItems,
  useHealthtechItemMutations,
  useHealthcareWorkflows,
  useHealthcareWorkflowMutations,
  useHealthcarePatientRights,
  useHealthcarePatientRightMutations,
  CitizenRight,
  HealthtechCategory,
  HealthtechItem,
  HealthcareWorkflow,
  HealthcarePatientRight,
} from '@/hooks/useLandingPageContent';

// Citizen Rights Tab
function CitizenRightsTab() {
  const { data: rights, isLoading } = useCitizenRights();
  const { upsert, remove } = useCitizenRightMutations();
  const [editingRight, setEditingRight] = useState<Partial<CitizenRight> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = () => {
    if (!editingRight?.id || !editingRight?.title) return;
    upsert.mutate(editingRight as CitizenRight & { id: string }, {
      onSuccess: () => {
        setIsDialogOpen(false);
        setEditingRight(null);
      },
    });
  };

  const handleToggleActive = (right: CitizenRight) => {
    upsert.mutate({ ...right, is_active: !right.is_active });
  };

  const categoryColors: Record<string, string> = {
    access: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    control: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    protection: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    'cross-border': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage citizen rights displayed on the Citizens landing page</p>
        <Button onClick={() => { setEditingRight({ id: '', title: '', description: '', article_numbers: [], icon: 'FileText', category: 'access', sort_order: (rights?.length || 0) + 1, is_active: true }); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Right
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Articles</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rights?.map((right) => (
            <TableRow key={right.id}>
              <TableCell className="font-medium">{right.title}</TableCell>
              <TableCell>
                <Badge className={categoryColors[right.category]}>{right.category}</Badge>
              </TableCell>
              <TableCell>{right.article_numbers.map(n => `Art. ${n}`).join(', ')}</TableCell>
              <TableCell>
                <Switch checked={right.is_active} onCheckedChange={() => handleToggleActive(right)} />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditingRight(right); setIsDialogOpen(true); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(right.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRight?.id ? 'Edit' : 'Add'} Citizen Right</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID (slug)</Label>
                <Input value={editingRight?.id || ''} onChange={(e) => setEditingRight({ ...editingRight, id: e.target.value })} placeholder="access-data" />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={editingRight?.icon || ''} onChange={(e) => setEditingRight({ ...editingRight, icon: e.target.value })} placeholder="FileSearch" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editingRight?.title || ''} onChange={(e) => setEditingRight({ ...editingRight, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingRight?.description || ''} onChange={(e) => setEditingRight({ ...editingRight, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={editingRight?.category} onValueChange={(v) => setEditingRight({ ...editingRight, category: v as CitizenRight['category'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="access">Access</SelectItem>
                    <SelectItem value="control">Control</SelectItem>
                    <SelectItem value="protection">Protection</SelectItem>
                    <SelectItem value="cross-border">Cross-Border</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Article Numbers (comma-separated)</Label>
                <Input value={editingRight?.article_numbers?.join(', ') || ''} onChange={(e) => setEditingRight({ ...editingRight, article_numbers: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) })} placeholder="3, 7" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={editingRight?.sort_order || 0} onChange={(e) => setEditingRight({ ...editingRight, sort_order: parseInt(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Health Tech Tab
function HealthTechTab() {
  const { data: categories, isLoading: catLoading } = useHealthtechCategories();
  const { data: items, isLoading: itemsLoading } = useHealthtechItems();
  const { upsert: upsertCat, remove: removeCat } = useHealthtechCategoryMutations();
  const { upsert: upsertItem, remove: removeItem } = useHealthtechItemMutations();
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<HealthtechItem> | null>(null);
  const [editingCat, setEditingCat] = useState<Partial<HealthtechCategory> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);

  const handleSaveItem = () => {
    if (!editingItem?.id || !editingItem?.requirement) return;
    upsertItem.mutate(editingItem as HealthtechItem & { id: string }, {
      onSuccess: () => {
        setIsItemDialogOpen(false);
        setEditingItem(null);
      },
    });
  };

  const handleSaveCat = () => {
    if (!editingCat?.id || !editingCat?.title) return;
    upsertCat.mutate(editingCat as HealthtechCategory & { id: string }, {
      onSuccess: () => {
        setIsCatDialogOpen(false);
        setEditingCat(null);
      },
    });
  };

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  };

  if (catLoading || itemsLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">Manage compliance categories and checklist items</p>
        <Button onClick={() => { setEditingCat({ id: '', title: '', description: '', icon: 'Server', sort_order: (categories?.length || 0) + 1, is_active: true }); setIsCatDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Category
        </Button>
      </div>

      <div className="space-y-2">
        {categories?.map((cat) => {
          const catItems = items?.filter(i => i.category_id === cat.id) || [];
          const isExpanded = expandedCat === cat.id;
          
          return (
            <Collapsible key={cat.id} open={isExpanded} onOpenChange={() => setExpandedCat(isExpanded ? null : cat.id)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <div>
                          <CardTitle className="text-base">{cat.title}</CardTitle>
                          <CardDescription className="text-xs">{catItems.length} items</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch checked={cat.is_active} onCheckedChange={() => upsertCat.mutate({ ...cat, is_active: !cat.is_active })} />
                        <Button variant="ghost" size="icon" onClick={() => { setEditingCat(cat); setIsCatDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => removeCat.mutate(cat.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="flex justify-end mb-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditingItem({ id: '', category_id: cat.id, requirement: '', description: '', article_references: [], evidence_hint: '', priority: 'medium', sort_order: catItems.length + 1, is_active: true }); setIsItemDialogOpen(true); }}>
                        <Plus className="h-3 w-3 mr-1" /> Add Item
                      </Button>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Requirement</TableHead>
                          <TableHead>Priority</TableHead>
                          <TableHead>Articles</TableHead>
                          <TableHead>Active</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {catItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.requirement}</TableCell>
                            <TableCell>
                              <Badge className={priorityColors[item.priority]}>{item.priority}</Badge>
                            </TableCell>
                            <TableCell>{item.article_references.map(n => `Art. ${n}`).join(', ')}</TableCell>
                            <TableCell>
                              <Switch checked={item.is_active} onCheckedChange={() => upsertItem.mutate({ ...item, is_active: !item.is_active })} />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsItemDialogOpen(true); }}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeItem.mutate(item.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Category Dialog */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat?.id ? 'Edit' : 'Add'} Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID (slug)</Label>
                <Input value={editingCat?.id || ''} onChange={(e) => setEditingCat({ ...editingCat, id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={editingCat?.icon || ''} onChange={(e) => setEditingCat({ ...editingCat, icon: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editingCat?.title || ''} onChange={(e) => setEditingCat({ ...editingCat, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingCat?.description || ''} onChange={(e) => setEditingCat({ ...editingCat, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCat} disabled={upsertCat.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem?.id ? 'Edit' : 'Add'} Compliance Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID (slug)</Label>
                <Input value={editingItem?.id || ''} onChange={(e) => setEditingItem({ ...editingItem, id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={editingItem?.priority} onValueChange={(v) => setEditingItem({ ...editingItem, priority: v as HealthtechItem['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Requirement</Label>
              <Input value={editingItem?.requirement || ''} onChange={(e) => setEditingItem({ ...editingItem, requirement: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingItem?.description || ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Evidence Hint</Label>
              <Textarea value={editingItem?.evidence_hint || ''} onChange={(e) => setEditingItem({ ...editingItem, evidence_hint: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article References (comma-separated)</Label>
              <Input value={editingItem?.article_references?.join(', ') || ''} onChange={(e) => setEditingItem({ ...editingItem, article_references: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={upsertItem.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Healthcare Tab
function HealthcareTab() {
  const { data: workflows, isLoading: wfLoading } = useHealthcareWorkflows();
  const { data: rights, isLoading: rightsLoading } = useHealthcarePatientRights();
  const { upsertWorkflow, removeWorkflow } = useHealthcareWorkflowMutations();
  const { upsert: upsertRight, remove: removeRight } = useHealthcarePatientRightMutations();
  const [editingWorkflow, setEditingWorkflow] = useState<Partial<HealthcareWorkflow> | null>(null);
  const [editingRight, setEditingRight] = useState<Partial<HealthcarePatientRight> | null>(null);
  const [isWfDialogOpen, setIsWfDialogOpen] = useState(false);
  const [isRightDialogOpen, setIsRightDialogOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('workflows');

  const handleSaveWorkflow = () => {
    if (!editingWorkflow?.id || !editingWorkflow?.title) return;
    upsertWorkflow.mutate(editingWorkflow as HealthcareWorkflow & { id: string }, {
      onSuccess: () => {
        setIsWfDialogOpen(false);
        setEditingWorkflow(null);
      },
    });
  };

  const handleSaveRight = () => {
    if (!editingRight?.right_name) return;
    upsertRight.mutate(editingRight, {
      onSuccess: () => {
        setIsRightDialogOpen(false);
        setEditingRight(null);
      },
    });
  };

  if (wfLoading || rightsLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="workflows">Clinical Workflows</TabsTrigger>
        <TabsTrigger value="patient-rights">Patient Rights</TabsTrigger>
      </TabsList>

      <TabsContent value="workflows" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Clinical workflow scenarios for healthcare professionals</p>
          <Button onClick={() => { setEditingWorkflow({ id: '', title: '', description: '', icon: 'FileText', scenario: '', key_takeaway: '', sort_order: (workflows?.length || 0) + 1, is_active: true }); setIsWfDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Workflow
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows?.map((wf) => (
              <TableRow key={wf.id}>
                <TableCell className="font-medium">{wf.title}</TableCell>
                <TableCell className="max-w-xs truncate">{wf.description}</TableCell>
                <TableCell>
                  <Switch checked={wf.is_active} onCheckedChange={() => upsertWorkflow.mutate({ ...wf, is_active: !wf.is_active })} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingWorkflow(wf); setIsWfDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeWorkflow.mutate(wf.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      <TabsContent value="patient-rights" className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">Key patient rights for healthcare professionals to know</p>
          <Button onClick={() => { setEditingRight({ right_name: '', description: '', article_number: 0, practical_implication: '', sort_order: (rights?.length || 0) + 1, is_active: true }); setIsRightDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Right
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Right</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Practical Implication</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rights?.map((right) => (
              <TableRow key={right.id}>
                <TableCell className="font-medium">{right.right_name}</TableCell>
                <TableCell>Art. {right.article_number}</TableCell>
                <TableCell className="max-w-xs truncate">{right.practical_implication}</TableCell>
                <TableCell>
                  <Switch checked={right.is_active} onCheckedChange={() => upsertRight.mutate({ ...right, is_active: !right.is_active })} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingRight(right); setIsRightDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeRight.mutate(right.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>

      {/* Workflow Dialog */}
      <Dialog open={isWfDialogOpen} onOpenChange={setIsWfDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingWorkflow?.id ? 'Edit' : 'Add'} Clinical Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID (slug)</Label>
                <Input value={editingWorkflow?.id || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, id: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Input value={editingWorkflow?.icon || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, icon: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editingWorkflow?.title || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingWorkflow?.description || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Textarea value={editingWorkflow?.scenario || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, scenario: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Key Takeaway</Label>
              <Textarea value={editingWorkflow?.key_takeaway || ''} onChange={(e) => setEditingWorkflow({ ...editingWorkflow, key_takeaway: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWfDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveWorkflow} disabled={upsertWorkflow.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Right Dialog */}
      <Dialog open={isRightDialogOpen} onOpenChange={setIsRightDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRight?.id ? 'Edit' : 'Add'} Patient Right</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Right Name</Label>
              <Input value={editingRight?.right_name || ''} onChange={(e) => setEditingRight({ ...editingRight, right_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editingRight?.description || ''} onChange={(e) => setEditingRight({ ...editingRight, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Article Number</Label>
              <Input type="number" value={editingRight?.article_number || 0} onChange={(e) => setEditingRight({ ...editingRight, article_number: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Practical Implication</Label>
              <Textarea value={editingRight?.practical_implication || ''} onChange={(e) => setEditingRight({ ...editingRight, practical_implication: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRightDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRight} disabled={upsertRight.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}

// Main Page
export default function AdminLandingPagesPage() {
  const { shouldRender, isLoading } = useAdminGuard();
  const [activeTab, setActiveTab] = useState('citizens');

  if (isLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  return (
    <AdminPageLayout
      title="Landing Pages"
      description="Manage content for stakeholder-specific landing pages"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="citizens" className="gap-2">
            <Heart className="h-4 w-4" /> Citizens
          </TabsTrigger>
          <TabsTrigger value="healthtech" className="gap-2">
            <Laptop className="h-4 w-4" /> Health Tech
          </TabsTrigger>
          <TabsTrigger value="healthcare" className="gap-2">
            <Stethoscope className="h-4 w-4" /> Healthcare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="citizens">
          <Card>
            <CardHeader>
              <CardTitle>Citizen Rights</CardTitle>
              <CardDescription>Rights displayed on the For Citizens page</CardDescription>
            </CardHeader>
            <CardContent>
              <CitizenRightsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="healthtech">
          <Card>
            <CardHeader>
              <CardTitle>Health Tech Compliance</CardTitle>
              <CardDescription>Compliance categories and checklist items for health tech companies</CardDescription>
            </CardHeader>
            <CardContent>
              <HealthTechTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="healthcare">
          <Card>
            <CardHeader>
              <CardTitle>Healthcare Professional Content</CardTitle>
              <CardDescription>Clinical workflows and patient rights guidance</CardDescription>
            </CardHeader>
            <CardContent>
              <HealthcareTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
}

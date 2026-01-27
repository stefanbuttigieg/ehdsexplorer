import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { 
  useEhdsObligations, 
  useCreateObligation,
  useUpdateObligation,
  useDeleteObligation,
  CATEGORY_LABELS,
  type ObligationCategory,
  type EhdsObligation
} from '@/hooks/useEhdsObligations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ClipboardList,
  Heart,
  Database,
  Settings,
  GripVertical
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

const CATEGORY_ICONS: Record<ObligationCategory, React.ReactNode> = {
  primary_use: <Heart className="h-4 w-4 text-destructive" />,
  secondary_use: <Database className="h-4 w-4 text-primary" />,
  general: <Settings className="h-4 w-4 text-muted-foreground" />,
};

const obligationSchema = z.object({
  id: z.string().min(1, 'ID is required').regex(/^[a-z0-9_]+$/, 'ID must be lowercase letters, numbers, and underscores only'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.enum(['primary_use', 'secondary_use', 'general']),
  article_references: z.string().optional(),
  sort_order: z.number().int().min(0),
  is_active: z.boolean(),
});

type ObligationFormValues = z.infer<typeof obligationSchema>;

export default function AdminObligationsPage() {
  const { loading: authLoading, shouldRender } = useAdminGuard();
  const { data: obligations, isLoading } = useEhdsObligations();
  const createObligation = useCreateObligation();
  const updateObligation = useUpdateObligation();
  const deleteObligation = useDeleteObligation();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingObligation, setEditingObligation] = useState<EhdsObligation | null>(null);
  const [obligationToDelete, setObligationToDelete] = useState<EhdsObligation | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const form = useForm<ObligationFormValues>({
    resolver: zodResolver(obligationSchema),
    defaultValues: {
      id: '',
      name: '',
      description: '',
      category: 'general',
      article_references: '',
      sort_order: 0,
      is_active: true,
    },
  });

  if (authLoading || !shouldRender) {
    return <AdminPageLoading />;
  }

  const filteredObligations = obligations?.filter(ob => 
    filterCategory === 'all' || ob.category === filterCategory
  ) || [];

  const obligationsByCategory = filteredObligations.reduce((acc, ob) => {
    if (!acc[ob.category]) acc[ob.category] = [];
    acc[ob.category].push(ob);
    return acc;
  }, {} as Record<ObligationCategory, EhdsObligation[]>);

  const handleOpenCreate = () => {
    setEditingObligation(null);
    const nextSortOrder = obligations?.length ? Math.max(...obligations.map(o => o.sort_order)) + 1 : 0;
    form.reset({
      id: '',
      name: '',
      description: '',
      category: 'general',
      article_references: '',
      sort_order: nextSortOrder,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (obligation: EhdsObligation) => {
    setEditingObligation(obligation);
    form.reset({
      id: obligation.id,
      name: obligation.name,
      description: obligation.description || '',
      category: obligation.category,
      article_references: obligation.article_references.join(', '),
      sort_order: obligation.sort_order,
      is_active: obligation.is_active,
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (obligation: EhdsObligation) => {
    setObligationToDelete(obligation);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (values: ObligationFormValues) => {
    const articleRefs = values.article_references
      ? values.article_references.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    try {
      if (editingObligation) {
        await updateObligation.mutateAsync({
          id: editingObligation.id,
          name: values.name,
          description: values.description || null,
          category: values.category,
          article_references: articleRefs,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
        toast({
          title: 'Obligation updated',
          description: `"${values.name}" has been updated.`,
        });
      } else {
        await createObligation.mutateAsync({
          id: values.id,
          name: values.name,
          description: values.description || null,
          category: values.category,
          article_references: articleRefs,
          sort_order: values.sort_order,
          is_active: values.is_active,
        });
        toast({
          title: 'Obligation created',
          description: `"${values.name}" has been created.`,
        });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save obligation.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!obligationToDelete) return;

    try {
      await deleteObligation.mutateAsync(obligationToDelete.id);
      toast({
        title: 'Obligation deleted',
        description: `"${obligationToDelete.name}" has been deleted.`,
      });
      setDeleteDialogOpen(false);
      setObligationToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete obligation.',
        variant: 'destructive',
      });
    }
  };

  const headerActions = (
    <Button onClick={handleOpenCreate} size="sm" className="h-8 px-2 sm:px-3">
      <Plus className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">Add Obligation</span>
    </Button>
  );

  return (
    <AdminPageLayout
      title="EHDS Obligations"
      description="Manage the obligation definitions tracked per member state"
      backTo="/admin"
      actions={headerActions}
    >
      <div className="space-y-6">
        {/* Filter and Stats */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Obligations Overview</CardTitle>
                <CardDescription>
                  {obligations?.length || 0} total obligations across {Object.keys(CATEGORY_LABELS).length} categories
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="primary_use">Primary Use</SelectItem>
                    <SelectItem value="secondary_use">Secondary Use</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
                <Link to="/admin/implementation-tracker">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Tracker Config</span>
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {(['primary_use', 'secondary_use', 'general'] as ObligationCategory[]).map(cat => (
                <div key={cat} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {CATEGORY_ICONS[cat]}
                    <span className="text-2xl font-bold">
                      {obligations?.filter(o => o.category === cat).length || 0}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Obligations List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading obligations...</p>
            </CardContent>
          </Card>
        ) : (
          (['primary_use', 'secondary_use', 'general'] as ObligationCategory[])
            .filter(cat => filterCategory === 'all' || filterCategory === cat)
            .map(category => (
              <Card key={category}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    {CATEGORY_ICONS[category]}
                    <CardTitle className="text-base">{CATEGORY_LABELS[category]}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {obligationsByCategory[category]?.length || 0}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {obligationsByCategory[category]?.length ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[40px]">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="hidden md:table-cell">Articles</TableHead>
                            <TableHead className="w-[80px]">Status</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {obligationsByCategory[category]
                            .sort((a, b) => a.sort_order - b.sort_order)
                            .map((obligation) => (
                            <TableRow key={obligation.id}>
                              <TableCell className="text-muted-foreground text-xs">
                                {obligation.sort_order}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{obligation.name}</p>
                                  {obligation.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                      {obligation.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <div className="flex flex-wrap gap-1">
                                  {obligation.article_references.slice(0, 3).map(ref => (
                                    <Badge key={ref} variant="outline" className="text-[10px]">
                                      {ref}
                                    </Badge>
                                  ))}
                                  {obligation.article_references.length > 3 && (
                                    <Badge variant="outline" className="text-[10px]">
                                      +{obligation.article_references.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={obligation.is_active ? 'default' : 'secondary'}>
                                  {obligation.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleOpenEdit(obligation)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => handleOpenDelete(obligation)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-muted-foreground text-sm">
                      No obligations in this category
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingObligation ? 'Edit Obligation' : 'Add Obligation'}
            </DialogTitle>
            <DialogDescription>
              {editingObligation 
                ? 'Update the obligation details below.' 
                : 'Create a new obligation to track across member states.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              {!editingObligation && (
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. dha_establishment" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Unique identifier (lowercase, underscores allowed). Cannot be changed later.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Establish Digital Health Authority" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this obligation entails..."
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="primary_use">Primary Use</SelectItem>
                          <SelectItem value="secondary_use">Secondary Use</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="article_references"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Article References</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Art. 12, Art. 13(1), Art. 55" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Comma-separated list of article references
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Inactive obligations won't appear in the public tracker
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createObligation.isPending || updateObligation.isPending}
                >
                  {editingObligation ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Obligation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{obligationToDelete?.name}"? 
              This will also remove all country status data for this obligation. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
}

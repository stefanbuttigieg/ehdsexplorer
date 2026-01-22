import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useArticles } from '@/hooks/useArticles';
import { useAllCrossRegulationReferences, CrossRegulationReference, getRelationshipInfo } from '@/hooks/useCrossRegulationReferences';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';

const REGULATIONS = [
  { short: 'GDPR', full: 'General Data Protection Regulation' },
  { short: 'AI Act', full: 'Artificial Intelligence Act' },
  { short: 'MDR', full: 'Medical Devices Regulation' },
  { short: 'Data Act', full: 'Data Act' },
  { short: 'DGA', full: 'Data Governance Act' },
];

const RELATIONSHIP_TYPES = [
  'complements',
  'relates_to',
  'specifies',
  'implements',
  'aligns_with',
];

interface FormData {
  article_id: number;
  regulation_short_name: string;
  regulation_name: string;
  provision_reference: string;
  provision_title: string;
  relationship_type: string;
  description: string;
  url: string;
}

const emptyFormData: FormData = {
  article_id: 1,
  regulation_short_name: 'GDPR',
  regulation_name: 'General Data Protection Regulation',
  provision_reference: '',
  provision_title: '',
  relationship_type: 'relates_to',
  description: '',
  url: '',
};

const AdminCrossRegulationPage = () => {
  const { loading: authLoading, shouldRender } = useAdminGuard();
  const { data: references = [], isLoading: refsLoading } = useAllCrossRegulationReferences();
  const { data: articles = [] } = useArticles();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<CrossRegulationReference | null>(null);
  const [deletingRef, setDeletingRef] = useState<CrossRegulationReference | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('cross_regulation_references' as any)
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-regulation-references'] });
      toast({ title: 'Reference created successfully' });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const { error } = await supabase
        .from('cross_regulation_references' as any)
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-regulation-references'] });
      toast({ title: 'Reference updated successfully' });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cross_regulation_references' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cross-regulation-references'] });
      toast({ title: 'Reference deleted successfully' });
      setDeleteDialogOpen(false);
      setDeletingRef(null);
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
  
  const closeDialog = () => {
    setDialogOpen(false);
    setEditingRef(null);
    setFormData(emptyFormData);
  };
  
  const openCreate = () => {
    setEditingRef(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  };
  
  const openEdit = (ref: CrossRegulationReference) => {
    setEditingRef(ref);
    setFormData({
      article_id: ref.article_id,
      regulation_short_name: ref.regulation_short_name,
      regulation_name: ref.regulation_name,
      provision_reference: ref.provision_reference,
      provision_title: ref.provision_title || '',
      relationship_type: ref.relationship_type,
      description: ref.description || '',
      url: ref.url || '',
    });
    setDialogOpen(true);
  };
  
  const openDelete = (ref: CrossRegulationReference) => {
    setDeletingRef(ref);
    setDeleteDialogOpen(true);
  };
  
  const handleSubmit = () => {
    if (!formData.provision_reference) {
      toast({ title: 'Provision reference is required', variant: 'destructive' });
      return;
    }
    
    if (editingRef) {
      updateMutation.mutate({ id: editingRef.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const handleRegulationChange = (shortName: string) => {
    const reg = REGULATIONS.find(r => r.short === shortName);
    setFormData(prev => ({
      ...prev,
      regulation_short_name: shortName,
      regulation_name: reg?.full || shortName,
    }));
  };
  
  const filteredReferences = references.filter(ref => {
    const query = searchQuery.toLowerCase();
    return (
      ref.regulation_short_name.toLowerCase().includes(query) ||
      ref.provision_reference.toLowerCase().includes(query) ||
      ref.provision_title?.toLowerCase().includes(query) ||
      ref.description?.toLowerCase().includes(query) ||
      `article ${ref.article_id}`.includes(query)
    );
  });

  if (authLoading) return <AdminPageLoading />;
  if (!shouldRender) return null;

  return (
    <AdminPageLayout
      title="Cross-Regulation References"
      description="Link EHDS articles to provisions in other EU regulations (GDPR, AI Act, MDR, etc.)"
      backTo="/admin"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search references..."
      actions={
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reference
        </Button>
      }
    >
      {refsLoading ? (
        <p className="text-muted-foreground">Loading references...</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>EHDS Article</TableHead>
                <TableHead>Regulation</TableHead>
                <TableHead>Provision</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReferences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No cross-regulation references found
                  </TableCell>
                </TableRow>
              ) : (
                filteredReferences.map((ref) => {
                  const relInfo = getRelationshipInfo(ref.relationship_type);
                  return (
                    <TableRow key={ref.id}>
                      <TableCell className="font-medium">Article {ref.article_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ref.regulation_short_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{ref.provision_reference}</span>
                          {ref.provision_title && (
                            <span className="text-sm text-muted-foreground">{ref.provision_title}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={relInfo.color}>{relInfo.label}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ref.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {ref.url && (
                            <Button variant="ghost" size="icon" asChild>
                              <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => openEdit(ref)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDelete(ref)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRef ? 'Edit Reference' : 'Add Cross-Regulation Reference'}</DialogTitle>
            <DialogDescription>
              Link an EHDS article to a provision in another EU regulation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="article_id">EHDS Article</Label>
              <Select
                value={formData.article_id.toString()}
                onValueChange={(val) => setFormData(prev => ({ ...prev, article_id: parseInt(val) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select article" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.article_number.toString()}>
                      Article {article.article_number}: {article.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="regulation">Regulation</Label>
              <Select
                value={formData.regulation_short_name}
                onValueChange={handleRegulationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select regulation" />
                </SelectTrigger>
                <SelectContent>
                  {REGULATIONS.map((reg) => (
                    <SelectItem key={reg.short} value={reg.short}>
                      {reg.short} - {reg.full}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="provision_reference">Provision Reference *</Label>
                <Input
                  id="provision_reference"
                  placeholder="e.g., Article 9"
                  value={formData.provision_reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, provision_reference: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="provision_title">Provision Title</Label>
                <Input
                  id="provision_title"
                  placeholder="e.g., Processing of special categories"
                  value={formData.provision_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, provision_title: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="relationship_type">Relationship Type</Label>
              <Select
                value={formData.relationship_type}
                onValueChange={(val) => setFormData(prev => ({ ...prev, relationship_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => {
                    const info = getRelationshipInfo(type);
                    return (
                      <SelectItem key={type} value={type}>
                        {info.label} - {info.description}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe how this provision relates to the EHDS article..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="url">Official URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://eur-lex.europa.eu/..."
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingRef ? 'Save Changes' : 'Create Reference'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Reference?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the link between Article {deletingRef?.article_id} and {deletingRef?.regulation_short_name} {deletingRef?.provision_reference}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRef && deleteMutation.mutate(deletingRef.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageLayout>
  );
};

export default AdminCrossRegulationPage;

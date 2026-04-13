import { useState } from 'react';
import { Edit, Save, X, Merge, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { DefinitionMergeDialog } from '@/components/admin/DefinitionMergeDialog';
import { DefinitionImportDialog } from '@/components/admin/DefinitionImportDialog';
import { DefinitionSourceEditor } from '@/components/admin/DefinitionSourceEditor';
import { getSourceLabel, type DefinitionSource } from '@/hooks/useDefinitions';
import { useAllDefinitionSources, groupSourcesByDefinition } from '@/hooks/useDefinitionSources';

interface DbDefinition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  source: DefinitionSource | null;
  created_at: string;
  updated_at: string;
}

const AdminDefinitionsPage = () => {
  const { shouldRender, user, isEditor } = useAdminGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [editingDefinition, setEditingDefinition] = useState<DbDefinition | null>(null);
  const [editedTerm, setEditedTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [newDefinitionText, setNewDefinitionText] = useState('');
  const [newSource, setNewSource] = useState<DefinitionSource>('ehds_regulation');
  const [newSourceArticle, setNewSourceArticle] = useState('');
  const [newImplementingActId, setNewImplementingActId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<DbDefinition | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Merge & Import dialogs
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<DbDefinition | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { data: definitions, isLoading } = useQuery({
    queryKey: ['admin-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('definitions')
        .select('*')
        .order('term', { ascending: true });
      
      if (error) throw error;
      return data as DbDefinition[];
    },
    enabled: !!user && isEditor
  });

  const { data: allSources = [] } = useAllDefinitionSources();
  const sourcesByDefinition = groupSourcesByDefinition(allSources);

  const { data: implementingActs = [] } = useQuery({
    queryKey: ['implementing-acts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_acts')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: !!user && isEditor,
  });

  const filteredDefinitions = definitions?.filter(def => {
    const matchesSearch = def.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.definition.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (sourceFilter !== 'all') {
      const defSources = sourcesByDefinition[def.id] || [];
      const hasSource = defSources.some(s => s.source === sourceFilter);
      if (!hasSource) return false;
    }
    
    return matchesSearch;
  }) || [];

  const handleEdit = (definition: DbDefinition) => {
    setEditingDefinition(definition);
    setEditedTerm(definition.term);
  };

  const handleMerge = (definition: DbDefinition) => {
    setMergeTarget(definition);
    setMergeDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingDefinition) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('definitions')
        .update({ term: editedTerm })
        .eq('id', editingDefinition.id);

      if (error) throw error;

      toast({
        title: 'Definition Updated',
        description: `"${editedTerm}" has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definition-sources'] });
      setEditingDefinition(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save definition',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newTerm.trim() || !newDefinitionText.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('definitions')
        .insert({
          term: newTerm.trim(),
          definition: newDefinitionText.trim(),
          source: newSource,
          source_article: newSourceArticle ? parseInt(newSourceArticle) : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create a source entry
      await supabase.from('definition_sources').insert({
        definition_id: data.id,
        source: newSource,
        source_text: newDefinitionText.trim(),
        source_article: newSourceArticle ? parseInt(newSourceArticle) : null,
        ...(newSource === 'implementing_act' && newImplementingActId ? { implementing_act_id: newImplementingActId } : {}),
      } as any);

      toast({
        title: 'Definition Created',
        description: `"${newTerm.trim()}" has been added.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definition-sources'] });
      setCreateDialogOpen(false);
      setNewTerm('');
      setNewDefinitionText('');
      setNewSource('ehds_regulation');
      setNewSourceArticle('');
      setNewImplementingActId('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create definition',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // Delete sources first (foreign key)
      await supabase
        .from('definition_sources')
        .delete()
        .eq('definition_id', deleteTarget.id);

      const { error } = await supabase
        .from('definitions')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast({
        title: 'Definition Deleted',
        description: `"${deleteTarget.term}" has been removed.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definition-sources'] });
      setDeleteTarget(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete definition',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const definitionsWithSource = (source: DefinitionSource) => {
    return new Set(allSources.filter(s => s.source === source).map(s => s.definition_id)).size;
  };

  if (!shouldRender) {
    return <AdminPageLoading />;
  }

  return (
    <AdminPageLayout
      title="Manage Definitions"
      description="Create, edit, merge, and delete glossary terms"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search definitions by term or content..."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Definition
          </Button>
        </div>
      }
    >
      {/* Source filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Badge 
          variant={sourceFilter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('all')}
        >
          All ({definitions?.length || 0})
        </Badge>
        <Badge 
          variant={sourceFilter === 'ehds_regulation' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('ehds_regulation')}
        >
          Regulation ({definitionsWithSource('ehds_regulation')})
        </Badge>
        <Badge 
          variant={sourceFilter === 'eu_ehr_glossary' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('eu_ehr_glossary')}
        >
          EU EHR ({definitionsWithSource('eu_ehr_glossary')})
        </Badge>
        <Badge 
          variant={sourceFilter === 'xt_ehr' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('xt_ehr')}
        >
          Xt-EHR ({definitionsWithSource('xt_ehr')})
        </Badge>
        <Badge 
          variant={sourceFilter === 'implementing_act' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('implementing_act')}
        >
          Implementing Acts ({definitionsWithSource('implementing_act')})
        </Badge>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDefinitions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No definitions found. Use the "Add Definition" button or Import to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDefinitions.map((definition) => (
            <Card key={definition.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline">{definition.term}</Badge>
                      {(sourcesByDefinition[definition.id] || []).map(src => (
                        <Badge key={src.id} variant="secondary" className="text-xs">
                          {getSourceLabel(src.source)}
                          {src.source_article && ` (Art. ${src.source_article})`}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {(sourcesByDefinition[definition.id]?.[0]?.source_text || definition.definition).substring(0, 200)}...
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMerge(definition)}
                      title="Merge with another definition"
                    >
                      <Merge className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(definition)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setDeleteTarget(definition)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Definition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Term *</Label>
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="e.g. Electronic health record"
              />
            </div>
            <div className="space-y-2">
              <Label>Definition *</Label>
              <Textarea
                value={newDefinitionText}
                onChange={(e) => setNewDefinitionText(e.target.value)}
                placeholder="The official definition text..."
                rows={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Source *</Label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value as DefinitionSource)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="ehds_regulation">EHDS Regulation</option>
                <option value="eu_ehr_glossary">EU EHR Database</option>
                <option value="xt_ehr">Xt-EHR</option>
                <option value="implementing_act">Implementing Act</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Source Article (optional)</Label>
              <Input
                type="number"
                value={newSourceArticle}
                onChange={(e) => setNewSourceArticle(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={isCreating || !newTerm.trim() || !newDefinitionText.trim()}>
                {isCreating ? 'Creating...' : 'Create Definition'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDefinition} onOpenChange={() => setEditingDefinition(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Definition: {editingDefinition?.term}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <div className="flex gap-2">
                <Input
                  value={editedTerm}
                  onChange={(e) => setEditedTerm(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSave} disabled={isSaving || editedTerm === editingDefinition?.term}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save Term'}
                </Button>
              </div>
            </div>
            
            {editingDefinition && (
              <DefinitionSourceEditor 
                definitionId={editingDefinition.id} 
                definitionTerm={editingDefinition.term}
              />
            )}
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setEditingDefinition(null)}>
                <X className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.term}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this definition and all its source entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Merge Dialog */}
      <DefinitionMergeDialog
        open={mergeDialogOpen}
        onOpenChange={setMergeDialogOpen}
        primaryDefinition={mergeTarget}
        allDefinitions={definitions || []}
      />

      {/* Import Dialog */}
      <DefinitionImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        existingTerms={definitions?.map(d => d.term) || []}
      />
    </AdminPageLayout>
  );
};

export default AdminDefinitionsPage;

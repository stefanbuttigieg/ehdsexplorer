import { useState } from 'react';
import { Edit, Save, X, Merge, Download } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { DefinitionMergeDialog } from '@/components/admin/DefinitionMergeDialog';
import { DefinitionImportDialog } from '@/components/admin/DefinitionImportDialog';
import { getSourceLabel, type DefinitionSource } from '@/hooks/useDefinitions';

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
  const [editedDefinition, setEditedDefinition] = useState('');
  const [editedSourceArticle, setEditedSourceArticle] = useState('');
  const [editedSource, setEditedSource] = useState<string>('ehds_regulation');
  const [isSaving, setIsSaving] = useState(false);
  
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

  const filteredDefinitions = definitions?.filter(def => {
    const matchesSearch = def.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      def.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = sourceFilter === 'all' || def.source === sourceFilter;
    return matchesSearch && matchesSource;
  }) || [];

  // Source counts
  const sourceCounts = definitions?.reduce((acc, def) => {
    const source = def.source || 'ehds_regulation';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const handleEdit = (definition: DbDefinition) => {
    setEditingDefinition(definition);
    setEditedTerm(definition.term);
    setEditedDefinition(definition.definition);
    setEditedSourceArticle(definition.source_article?.toString() || '');
    setEditedSource(definition.source || 'ehds_regulation');
  };

  const handleMerge = (definition: DbDefinition) => {
    setMergeTarget(definition);
    setMergeDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingDefinition) return;
    
    setIsSaving(true);
    try {
      const sourceArticle = editedSourceArticle ? parseInt(editedSourceArticle) : null;

      const { error } = await supabase
        .from('definitions')
        .update({ 
          term: editedTerm,
          definition: editedDefinition,
          source_article: isNaN(sourceArticle as number) ? null : sourceArticle,
          source: editedSource as DefinitionSource
        })
        .eq('id', editingDefinition.id);

      if (error) throw error;

      toast({
        title: 'Definition Updated',
        description: `"${editedTerm}" has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
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

  if (!shouldRender) {
    return <AdminPageLoading />;
  }

  return (
    <AdminPageLayout
      title="Manage Definitions"
      description="Edit, merge, and import glossary terms"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search definitions by term or content..."
      actions={
        <Button onClick={() => setImportDialogOpen(true)}>
          <Download className="h-4 w-4 mr-2" />
          Import Xt-EHR
        </Button>
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
          Regulation ({sourceCounts['ehds_regulation'] || 0})
        </Badge>
        <Badge 
          variant={sourceFilter === 'eu_ehr_glossary' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('eu_ehr_glossary')}
        >
          EU EHR ({sourceCounts['eu_ehr_glossary'] || 0})
        </Badge>
        <Badge 
          variant={sourceFilter === 'xt_ehr' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSourceFilter('xt_ehr')}
        >
          Xt-EHR ({sourceCounts['xt_ehr'] || 0})
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
            No definitions found. Use the Import button to add Xt-EHR glossary terms.
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
                      <Badge variant="secondary" className="text-xs">
                        {getSourceLabel(definition.source)}
                      </Badge>
                      {definition.source_article && (
                        <span className="text-xs text-muted-foreground">
                          Art. {definition.source_article}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {definition.definition.substring(0, 200)}...
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDefinition} onOpenChange={() => setEditingDefinition(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Definition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Term</Label>
              <Input
                value={editedTerm}
                onChange={(e) => setEditedTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Definition</Label>
              <Textarea
                value={editedDefinition}
                onChange={(e) => setEditedDefinition(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={editedSource} onValueChange={setEditedSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ehds_regulation">EHDS Regulation</SelectItem>
                    <SelectItem value="eu_ehr_glossary">EU EHR Database</SelectItem>
                    <SelectItem value="xt_ehr">Xt-EHR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source Article (optional)</Label>
                <Input
                  type="number"
                  value={editedSourceArticle}
                  onChange={(e) => setEditedSourceArticle(e.target.value)}
                  placeholder="e.g., 2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingDefinition(null)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

import { useState } from 'react';
import { Edit, Save, X, Merge, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    
    // Filter by source using the sources table
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

  // Get source counts from the sources table
  const { data: allSources = [] } = useAllDefinitionSources();
  const sourcesByDefinition = groupSourcesByDefinition(allSources);
  
  // Calculate actual source counts
  const actualSourceCounts = allSources.reduce((acc, src) => {
    acc[src.source] = (acc[src.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get unique definition IDs that have each source
  const definitionsWithSource = (source: DefinitionSource) => {
    return new Set(allSources.filter(s => s.source === source).map(s => s.definition_id)).size;
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
                      {/* Show all sources for this definition */}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            
            {/* Source-specific definitions */}
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

import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';

interface DbDefinition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  created_at: string;
  updated_at: string;
}

const AdminDefinitionsPage = () => {
  const { shouldRender, user, isEditor } = useAdminGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingDefinition, setEditingDefinition] = useState<DbDefinition | null>(null);
  const [editedTerm, setEditedTerm] = useState('');
  const [editedDefinition, setEditedDefinition] = useState('');
  const [editedSourceArticle, setEditedSourceArticle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const filteredDefinitions = definitions?.filter(def =>
    def.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    def.definition.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (definition: DbDefinition) => {
    setEditingDefinition(definition);
    setEditedTerm(definition.term);
    setEditedDefinition(definition.definition);
    setEditedSourceArticle(definition.source_article?.toString() || '');
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
          source_article: isNaN(sourceArticle as number) ? null : sourceArticle
        })
        .eq('id', editingDefinition.id);

      if (error) throw error;

      toast({
        title: 'Definition Updated',
        description: `"${editedTerm}" has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
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
      description="Edit terms and their definitions"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search definitions by term or content..."
    >
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
            No definitions found. Use the bulk import feature to add definitions.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDefinitions.map((definition) => (
            <Card key={definition.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{definition.term}</Badge>
                      {definition.source_article && (
                        <span className="text-xs text-muted-foreground">
                          Source: Art. {definition.source_article}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {definition.definition.substring(0, 200)}...
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(definition)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            <div className="space-y-2">
              <Label>Source Article (optional)</Label>
              <Input
                type="number"
                value={editedSourceArticle}
                onChange={(e) => setEditedSourceArticle(e.target.value)}
                placeholder="e.g., 2"
              />
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
    </AdminPageLayout>
  );
};

export default AdminDefinitionsPage;

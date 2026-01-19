import { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFootnotes } from '@/hooks/useFootnotes';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { FootnoteManager } from '@/components/admin/FootnoteManager';

interface DbRecital {
  id: number;
  recital_number: number;
  content: string;
  related_articles: number[] | null;
  created_at: string;
  updated_at: string;
}

const AdminRecitalsPage = () => {
  const { shouldRender, user, isEditor } = useAdminGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecital, setEditingRecital] = useState<DbRecital | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedRelatedArticles, setEditedRelatedArticles] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkRelatedArticles, setBulkRelatedArticles] = useState('');

  const { data: allFootnotes = [] } = useFootnotes();

  const { data: recitals, isLoading } = useQuery({
    queryKey: ['admin-recitals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recitals')
        .select('*')
        .order('recital_number', { ascending: true });
      
      if (error) throw error;
      return data as DbRecital[];
    },
    enabled: !!user && isEditor
  });

  const filteredRecitals = recitals?.filter(recital =>
    recital.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recital.recital_number.toString().includes(searchQuery)
  ) || [];

  const {
    selectedCount,
    selectedArray,
    isSelected,
    isAllSelected,
    toggle,
    clearSelection,
    toggleAll,
  } = useBulkSelection(filteredRecitals.map((r) => r.id));

  const handleEdit = (recital: DbRecital) => {
    setEditingRecital(recital);
    setEditedContent(recital.content);
    setEditedRelatedArticles(recital.related_articles?.join(', ') || '');
  };

  const recitalFootnotes = editingRecital 
    ? allFootnotes.filter(fn => fn.recital_id === editingRecital.id)
    : [];

  const handleSave = async () => {
    if (!editingRecital) return;
    
    setIsSaving(true);
    try {
      const relatedArticlesArray = editedRelatedArticles
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const { error } = await supabase
        .from('recitals')
        .update({ 
          content: editedContent,
          related_articles: relatedArticlesArray.length > 0 ? relatedArticlesArray : null
        })
        .eq('id', editingRecital.id);

      if (error) throw error;

      toast({
        title: 'Recital Updated',
        description: `Recital ${editingRecital.recital_number} has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-recitals'] });
      setEditingRecital(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save recital',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSave = async () => {
    if (selectedCount === 0) return;
    
    setIsSaving(true);
    try {
      const relatedArticlesArray = bulkRelatedArticles
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const { error } = await supabase
        .from('recitals')
        .update({ 
          related_articles: relatedArticlesArray.length > 0 ? relatedArticlesArray : null
        })
        .in('id', selectedArray);

      if (error) throw error;

      toast({
        title: 'Bulk Update Complete',
        description: `Updated related articles for ${selectedCount} recitals.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-recitals'] });
      setShowBulkEdit(false);
      clearSelection();
      setBulkRelatedArticles('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update recitals',
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
      title="Manage Recitals"
      description="Edit recital content and related articles"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search recitals by number or content..."
    >
      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button onClick={() => setShowBulkEdit(true)} size="sm" className="text-xs sm:text-sm">
            <Edit className="h-4 w-4 mr-1" />
            Bulk Edit ({selectedCount})
          </Button>
          <Button variant="outline" size="sm" onClick={clearSelection} className="text-xs sm:text-sm">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </div>
      )}

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
      ) : (
        <div className="space-y-3">
          {filteredRecitals.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all recitals"
              />
              <span className="text-sm text-muted-foreground">
                {isAllSelected ? 'Deselect all' : 'Select all'}
              </span>
            </div>
          )}
          {filteredRecitals.map((recital) => (
            <Card 
              key={recital.id} 
              className={`hover:border-primary/50 transition-colors ${isSelected(recital.id) ? 'border-primary bg-primary/5' : ''}`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Checkbox
                    checked={isSelected(recital.id)}
                    onCheckedChange={() => toggle(recital.id)}
                    aria-label={`Select recital ${recital.recital_number}`}
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">Recital {recital.recital_number}</Badge>
                      {recital.related_articles && recital.related_articles.length > 0 && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          Related: Art. {recital.related_articles.slice(0, 3).join(', ')}{recital.related_articles.length > 3 ? '...' : ''}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {recital.content.substring(0, 200)}...
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(recital)} className="shrink-0">
                    <Edit className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Recital Dialog */}
      <Dialog open={!!editingRecital} onOpenChange={() => setEditingRecital(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recital {editingRecital?.recital_number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Content</Label>
              <MarkdownEditor
                value={editedContent}
                onChange={setEditedContent}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Related Articles (comma-separated)</Label>
              <Input
                value={editedRelatedArticles}
                onChange={(e) => setEditedRelatedArticles(e.target.value)}
                placeholder="e.g., 1, 2, 3"
              />
            </div>
            
            <FootnoteManager
              footnotes={recitalFootnotes}
              recitalId={editingRecital?.id}
            />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingRecital(null)}>
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

      {/* Bulk Edit Dialog */}
      <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedCount} Recitals</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Set Related Articles (comma-separated)</Label>
              <Input
                value={bulkRelatedArticles}
                onChange={(e) => setBulkRelatedArticles(e.target.value)}
                placeholder="e.g., 1, 2, 3 (leave empty to clear)"
              />
              <p className="text-xs text-muted-foreground">
                This will replace the related articles for all selected recitals.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleBulkSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Update All'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminRecitalsPage;

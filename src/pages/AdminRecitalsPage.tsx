import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Edit, Save, X, ArrowLeft, CheckSquare, Square } from 'lucide-react';
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
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DbRecital {
  id: number;
  recital_number: number;
  content: string;
  related_articles: number[] | null;
  created_at: string;
  updated_at: string;
}

const AdminRecitalsPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecital, setEditingRecital] = useState<DbRecital | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedRelatedArticles, setEditedRelatedArticles] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkRelatedArticles, setBulkRelatedArticles] = useState('');

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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  const filteredRecitals = recitals?.filter(recital =>
    recital.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recital.recital_number.toString().includes(searchQuery)
  ) || [];

  const handleEdit = (recital: DbRecital) => {
    setEditingRecital(recital);
    setEditedContent(recital.content);
    setEditedRelatedArticles(recital.related_articles?.join(', ') || '');
  };

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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecitals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecitals.map(r => r.id)));
    }
  };

  const handleBulkSave = async () => {
    if (selectedIds.size === 0) return;
    
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
        .in('id', Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: 'Bulk Update Complete',
        description: `Updated related articles for ${selectedIds.size} recitals.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-recitals'] });
      setShowBulkEdit(false);
      setSelectedIds(new Set());
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

  if (loading || !user || !isEditor) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-serif">Manage Recitals</h1>
            <p className="text-muted-foreground">Edit recital content and related articles</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recitals by number or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedIds.size > 0 && (
            <Button onClick={() => setShowBulkEdit(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Bulk Edit ({selectedIds.size})
            </Button>
          )}
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
        ) : (
          <div className="space-y-3">
            {filteredRecitals.length > 0 && (
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedIds.size === filteredRecitals.length && filteredRecitals.length > 0}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all recitals"
                />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size === filteredRecitals.length ? 'Deselect all' : 'Select all'}
                </span>
              </div>
            )}
            {filteredRecitals.map((recital) => (
              <Card 
                key={recital.id} 
                className={`hover:border-primary/50 transition-colors ${selectedIds.has(recital.id) ? 'border-primary bg-primary/5' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedIds.has(recital.id)}
                      onCheckedChange={() => toggleSelect(recital.id)}
                      aria-label={`Select recital ${recital.recital_number}`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Recital {recital.recital_number}</Badge>
                        {recital.related_articles && recital.related_articles.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            Related: Art. {recital.related_articles.join(', ')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {recital.content.substring(0, 200)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(recital)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                  rows={15}
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

        <Dialog open={showBulkEdit} onOpenChange={setShowBulkEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Edit {selectedIds.size} Recitals</DialogTitle>
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
      </div>
    </Layout>
  );
};

export default AdminRecitalsPage;

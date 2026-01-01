import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Edit, Save, X, ArrowLeft } from 'lucide-react';
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
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DbDefinition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  created_at: string;
  updated_at: string;
}

const AdminDefinitionsPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

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
      <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">Manage Definitions</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Edit terms and their definitions</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search definitions by term or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
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
      </div>
    </Layout>
  );
};

export default AdminDefinitionsPage;

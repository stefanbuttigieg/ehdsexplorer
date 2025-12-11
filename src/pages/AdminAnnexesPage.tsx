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

interface DbAnnex {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const AdminAnnexesPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAnnex, setEditingAnnex] = useState<DbAnnex | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: annexes, isLoading } = useQuery({
    queryKey: ['admin-annexes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('annexes')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data as DbAnnex[];
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

  const filteredAnnexes = annexes?.filter(annex =>
    annex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    annex.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    annex.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (annex: DbAnnex) => {
    setEditingAnnex(annex);
    setEditedTitle(annex.title);
    setEditedContent(annex.content);
  };

  const handleSave = async () => {
    if (!editingAnnex) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('annexes')
        .update({ 
          title: editedTitle,
          content: editedContent
        })
        .eq('id', editingAnnex.id);

      if (error) throw error;

      toast({
        title: 'Annex Updated',
        description: `Annex ${editingAnnex.id} has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-annexes'] });
      setEditingAnnex(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save annex',
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
            <h1 className="text-3xl font-bold font-serif">Manage Annexes</h1>
            <p className="text-muted-foreground">Edit annex titles and content</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search annexes by ID, title, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAnnexes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No annexes found. Use the bulk import feature to add annexes.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAnnexes.map((annex) => (
              <Card key={annex.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">Annex {annex.id}</Badge>
                        <span className="font-medium truncate">{annex.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {annex.content.substring(0, 200)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(annex)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingAnnex} onOpenChange={() => setEditingAnnex(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Annex {editingAnnex?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={20}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingAnnex(null)}>
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

export default AdminAnnexesPage;

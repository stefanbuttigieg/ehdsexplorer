import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Edit, Save, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { recitals as staticRecitals, Recital } from '@/data/recitals';

const AdminRecitalsPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecital, setEditingRecital] = useState<Recital | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedRelatedArticles, setEditedRelatedArticles] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  const filteredRecitals = staticRecitals.filter(recital =>
    recital.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recital.id.toString().includes(searchQuery)
  );

  const handleEdit = (recital: Recital) => {
    setEditingRecital(recital);
    setEditedContent(recital.content);
    setEditedRelatedArticles(recital.relatedArticles.join(', '));
  };

  const handleSave = async () => {
    if (!editingRecital) return;
    
    setIsSaving(true);
    toast({
      title: 'Edit Recorded',
      description: `Changes to Recital ${editingRecital.id} noted. Database sync coming soon.`,
    });
    setIsSaving(false);
    setEditingRecital(null);
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recitals by number or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredRecitals.map((recital) => (
            <Card key={recital.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Recital {recital.id}</Badge>
                      {recital.relatedArticles.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Related: Art. {recital.relatedArticles.join(', ')}
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

        <Dialog open={!!editingRecital} onOpenChange={() => setEditingRecital(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Recital {editingRecital?.id}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
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
      </div>
    </Layout>
  );
};

export default AdminRecitalsPage;

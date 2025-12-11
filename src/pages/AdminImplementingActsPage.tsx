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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DbImplementingAct {
  id: string;
  title: string;
  description: string;
  article_reference: string;
  type: string;
  theme: string;
  status: string;
  official_link: string | null;
  deliverable_link: string | null;
  feedback_deadline: string | null;
  related_articles: number[] | null;
  created_at: string;
  updated_at: string;
}

const AdminImplementingActsPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAct, setEditingAct] = useState<DbImplementingAct | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedArticleReference, setEditedArticleReference] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedTheme, setEditedTheme] = useState('');
  const [editedStatus, setEditedStatus] = useState('');
  const [editedOfficialLink, setEditedOfficialLink] = useState('');
  const [editedDeliverableLink, setEditedDeliverableLink] = useState('');
  const [editedFeedbackDeadline, setEditedFeedbackDeadline] = useState('');
  const [editedRelatedArticles, setEditedRelatedArticles] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: implementingActs, isLoading } = useQuery({
    queryKey: ['admin-implementing-acts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_acts')
        .select('*')
        .order('id', { ascending: true });
      
      if (error) throw error;
      return data as DbImplementingAct[];
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

  const filteredActs = implementingActs?.filter(act =>
    act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    act.theme.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (act: DbImplementingAct) => {
    setEditingAct(act);
    setEditedTitle(act.title);
    setEditedDescription(act.description);
    setEditedArticleReference(act.article_reference);
    setEditedType(act.type);
    setEditedTheme(act.theme);
    setEditedStatus(act.status);
    setEditedOfficialLink(act.official_link || '');
    setEditedDeliverableLink(act.deliverable_link || '');
    setEditedFeedbackDeadline(act.feedback_deadline || '');
    setEditedRelatedArticles(act.related_articles?.join(', ') || '');
  };

  const handleSave = async () => {
    if (!editingAct) return;
    
    setIsSaving(true);
    try {
      const relatedArticlesArray = editedRelatedArticles
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const { error } = await supabase
        .from('implementing_acts')
        .update({ 
          title: editedTitle,
          description: editedDescription,
          article_reference: editedArticleReference,
          type: editedType,
          theme: editedTheme,
          status: editedStatus,
          official_link: editedOfficialLink || null,
          deliverable_link: editedDeliverableLink || null,
          feedback_deadline: editedFeedbackDeadline || null,
          related_articles: relatedArticlesArray.length > 0 ? relatedArticlesArray : null
        })
        .eq('id', editingAct.id);

      if (error) throw error;

      toast({
        title: 'Implementing Act Updated',
        description: `"${editedTitle}" has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-implementing-acts'] });
      setEditingAct(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save implementing act',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Adopted': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Open for Consultation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
            <h1 className="text-3xl font-bold font-serif">Manage Implementing Acts</h1>
            <p className="text-muted-foreground">Edit implementing acts and their details</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, title, description, or theme..."
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
        ) : filteredActs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No implementing acts found. Use the bulk import feature to add implementing acts.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActs.map((act) => (
              <Card key={act.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="outline">{act.id}</Badge>
                        <Badge className={getStatusColor(act.status)}>{act.status}</Badge>
                        <Badge variant="secondary">{act.theme}</Badge>
                      </div>
                      <p className="font-medium mb-1">{act.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {act.description.substring(0, 200)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(act)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingAct} onOpenChange={() => setEditingAct(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit {editingAct?.id}</DialogTitle>
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
                <Label>Description</Label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Article Reference</Label>
                  <Input
                    value={editedArticleReference}
                    onChange={(e) => setEditedArticleReference(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editedType} onValueChange={setEditedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Implementing Act">Implementing Act</SelectItem>
                      <SelectItem value="Delegated Act">Delegated Act</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={editedTheme} onValueChange={setEditedTheme}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Primary Use">Primary Use</SelectItem>
                      <SelectItem value="EHR Systems">EHR Systems</SelectItem>
                      <SelectItem value="Secondary Use">Secondary Use</SelectItem>
                      <SelectItem value="Health Data Access Bodies">Health Data Access Bodies</SelectItem>
                      <SelectItem value="Cross-Border">Cross-Border</SelectItem>
                      <SelectItem value="EHDS Board">EHDS Board</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editedStatus} onValueChange={setEditedStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Open for Consultation">Open for Consultation</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Adopted">Adopted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Official Link (optional)</Label>
                <Input
                  value={editedOfficialLink}
                  onChange={(e) => setEditedOfficialLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Deliverable Link (optional)</Label>
                <Input
                  value={editedDeliverableLink}
                  onChange={(e) => setEditedDeliverableLink(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Feedback Deadline (optional)</Label>
                <Input
                  value={editedFeedbackDeadline}
                  onChange={(e) => setEditedFeedbackDeadline(e.target.value)}
                  placeholder="e.g., 06 January 2026"
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
                <Button variant="outline" onClick={() => setEditingAct(null)}>
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

export default AdminImplementingActsPage;

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Edit, Save, X, ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import MarkdownEditor from '@/components/MarkdownEditor';
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
  themes: string[] | null;
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
  const [isCreating, setIsCreating] = useState(false);
  const [editedId, setEditedId] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedArticleReference, setEditedArticleReference] = useState('');
  const [editedType, setEditedType] = useState('');
  const [editedThemes, setEditedThemes] = useState<string[]>([]);
  const [editedStatus, setEditedStatus] = useState('');
  const [editedOfficialLink, setEditedOfficialLink] = useState('');
  const [editedDeliverableLink, setEditedDeliverableLink] = useState('');
  const [editedFeedbackDeadline, setEditedFeedbackDeadline] = useState('');
  const [editedRelatedArticles, setEditedRelatedArticles] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAct, setDeletingAct] = useState<DbImplementingAct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const themeOptions = [
    { value: 'primary-use', label: 'Primary Use' },
    { value: 'ehr-systems', label: 'EHR Systems' },
    { value: 'secondary-use', label: 'Secondary Use' },
    { value: 'health-data-access', label: 'Health Data Access Bodies' },
    { value: 'cross-border', label: 'Cross-Border' },
    { value: 'ehds-board', label: 'EHDS Board' },
  ];

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

  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditedId('');
    setEditedTitle('');
    setEditedDescription('');
    setEditedArticleReference('');
    setEditedType('implementing');
    setEditedThemes(['primary-use']);
    setEditedStatus('pending');
    setEditedOfficialLink('');
    setEditedDeliverableLink('');
    setEditedFeedbackDeadline('');
    setEditedRelatedArticles('');
  };

  const handleCloseDialog = () => {
    setEditingAct(null);
    setIsCreating(false);
  };

  const handleEdit = (act: DbImplementingAct) => {
    setEditingAct(act);
    setIsCreating(false);
    setEditedId(act.id);
    setEditedTitle(act.title);
    setEditedDescription(act.description);
    setEditedArticleReference(act.article_reference);
    setEditedType(act.type);
    // Use themes array if available, otherwise fallback to single theme
    setEditedThemes(act.themes && act.themes.length > 0 ? act.themes : [act.theme]);
    setEditedStatus(act.status);
    setEditedOfficialLink(act.official_link || '');
    setEditedDeliverableLink(act.deliverable_link || '');
    setEditedFeedbackDeadline(act.feedback_deadline || '');
    setEditedRelatedArticles(act.related_articles?.join(', ') || '');
  };

  const handleCreate = async () => {
    if (!editedId.trim() || !editedTitle.trim() || !editedArticleReference.trim()) {
      toast({
        title: 'Validation Error',
        description: 'ID, Title, and Article Reference are required.',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicate ID
    const existingAct = implementingActs?.find(act => act.id === editedId.trim());
    if (existingAct) {
      toast({
        title: 'Duplicate ID',
        description: 'An implementing act with this ID already exists.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const relatedArticlesArray = editedRelatedArticles
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const { error } = await supabase
        .from('implementing_acts')
        .insert({
          id: editedId.trim(),
          title: editedTitle,
          description: editedDescription,
          article_reference: editedArticleReference,
          type: editedType,
          theme: editedThemes[0] || 'primary-use', // Keep primary theme for backward compatibility
          themes: editedThemes,
          status: editedStatus,
          official_link: editedOfficialLink || null,
          deliverable_link: editedDeliverableLink || null,
          feedback_deadline: editedFeedbackDeadline || null,
          related_articles: relatedArticlesArray.length > 0 ? relatedArticlesArray : null,
        });

      if (error) throw error;

      toast({
        title: 'Implementing Act Created',
        description: `"${editedTitle}" has been created.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-implementing-acts'] });
      queryClient.invalidateQueries({ queryKey: ['implementing-acts'] });
      handleCloseDialog();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create implementing act',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!editingAct) return;
    
    setIsSaving(true);
    try {
      const relatedArticlesArray = editedRelatedArticles
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      const oldStatus = editingAct.status;
      const statusChanged = oldStatus !== editedStatus;

      const { error } = await supabase
        .from('implementing_acts')
        .update({ 
          title: editedTitle,
          description: editedDescription,
          article_reference: editedArticleReference,
          type: editedType,
          theme: editedThemes[0] || 'primary-use', // Keep primary theme for backward compatibility
          themes: editedThemes,
          status: editedStatus,
          official_link: editedOfficialLink || null,
          deliverable_link: editedDeliverableLink || null,
          feedback_deadline: editedFeedbackDeadline || null,
          related_articles: relatedArticlesArray.length > 0 ? relatedArticlesArray : null,
          previous_status: statusChanged ? oldStatus : editingAct.status
        })
        .eq('id', editingAct.id);

      if (error) throw error;

      // Send email alerts if status changed
      if (statusChanged) {
        try {
          const { error: alertError } = await supabase.functions.invoke('send-status-alert', {
            body: {
              implementing_act_id: editingAct.id,
              old_status: oldStatus,
              new_status: editedStatus,
              title: editedTitle
            }
          });
          
          if (alertError) {
            console.error('Failed to send status alerts:', alertError);
          } else {
            toast({
              title: 'Status Alerts Sent',
              description: 'Subscribers have been notified of the status change.',
            });
          }
        } catch (alertErr) {
          console.error('Error sending alerts:', alertErr);
        }
      }

      toast({
        title: 'Implementing Act Updated',
        description: `"${editedTitle}" has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-implementing-acts'] });
      queryClient.invalidateQueries({ queryKey: ['implementing-acts'] });
      handleCloseDialog();
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

  const handleDelete = async () => {
    if (!deletingAct) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('implementing_acts')
        .delete()
        .eq('id', deletingAct.id);

      if (error) throw error;

      toast({
        title: 'Implementing Act Deleted',
        description: `"${deletingAct.title}" has been deleted.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-implementing-acts'] });
      queryClient.invalidateQueries({ queryKey: ['implementing-acts'] });
      setDeletingAct(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete implementing act',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif">Manage Implementing Acts</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Create, edit, and manage implementing acts</p>
            </div>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="self-start sm:self-auto">
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
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
        ) : filteredActs.length === 0 && !searchQuery ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No implementing acts found. Click "Add New" to create one.
            </CardContent>
          </Card>
        ) : filteredActs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No implementing acts match your search.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActs.map((act) => (
              <Card key={act.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{act.id}</Badge>
                        <Badge className={`text-xs ${getStatusColor(act.status)}`}>{act.status}</Badge>
                        <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{act.theme}</Badge>
                      </div>
                      <p className="font-medium text-sm sm:text-base mb-1 line-clamp-1">{act.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 hidden sm:block">
                        {act.description.substring(0, 200)}...
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link to={`/admin/implementing-acts/${act.id}/content`}>
                        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                          <FileText className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Content</span>
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(act)} className="text-xs sm:text-sm">
                        <Edit className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDeletingAct(act)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingAct || isCreating} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? 'Create New Implementing Act' : `Edit ${editingAct?.id}`}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {isCreating && (
                <div className="space-y-2">
                  <Label>ID (unique identifier)*</Label>
                  <Input
                    value={editedId}
                    onChange={(e) => setEditedId(e.target.value)}
                    placeholder="e.g., ia-new-act"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Title*</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <MarkdownEditor
                  value={editedDescription}
                  onChange={setEditedDescription}
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Article Reference*</Label>
                  <Input
                    value={editedArticleReference}
                    onChange={(e) => setEditedArticleReference(e.target.value)}
                    placeholder="e.g., Art. 6(7)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={editedType} onValueChange={setEditedType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="implementing">Implementing Act</SelectItem>
                      <SelectItem value="delegated">Delegated Act</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Themes (select multiple)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md">
                  {themeOptions.map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedThemes.includes(option.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setEditedThemes([...editedThemes, option.value]);
                          } else {
                            setEditedThemes(editedThemes.filter(t => t !== option.value));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
                {editedThemes.length === 0 && (
                  <p className="text-sm text-destructive">Please select at least one theme</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editedStatus} onValueChange={setEditedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="feedback">Open for Feedback</SelectItem>
                    <SelectItem value="feedback-closed">Feedback Closed</SelectItem>
                    <SelectItem value="progress">In Progress</SelectItem>
                    <SelectItem value="adopted">Adopted</SelectItem>
                  </SelectContent>
                </Select>
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
                <Button variant="outline" onClick={handleCloseDialog}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={isCreating ? handleCreate : handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : isCreating ? 'Create' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deletingAct} onOpenChange={() => setDeletingAct(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Implementing Act</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deletingAct?.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminImplementingActsPage;

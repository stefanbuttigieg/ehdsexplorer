import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Plus, Sparkles, Trash2, Eye, EyeOff, Loader2, Pencil } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNewsSummaries, useGenerateNewsSummary, useUpdateNewsSummary, useDeleteNewsSummary, NewsSummary } from '@/hooks/useNewsSummaries';

const AdminNewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isEditor } = useAuth();
  const { data: summaries, isLoading } = useNewsSummaries(false);
  const generateMutation = useGenerateNewsSummary();
  const updateMutation = useUpdateNewsSummary();
  const deleteMutation = useDeleteNewsSummary();

  const [editingItem, setEditingItem] = useState<NewsSummary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');

  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!user || !isEditor) {
    navigate('/admin/auth');
    return null;
  }

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync();
      toast({
        title: "Summary Generated",
        description: result.message || "Weekly summary has been generated. Review and publish it.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTogglePublish = async (summary: NewsSummary) => {
    try {
      await updateMutation.mutateAsync({
        id: summary.id,
        is_published: !summary.is_published,
      });
      toast({
        title: summary.is_published ? "Unpublished" : "Published",
        description: `Summary has been ${summary.is_published ? 'unpublished' : 'published'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast({
        title: "Deleted",
        description: "Summary has been deleted.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEdit = (summary: NewsSummary) => {
    setEditingItem(summary);
    setEditTitle(summary.title);
    setEditSummary(summary.summary);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        title: editTitle,
        summary: editSummary,
      });
      toast({ title: "Saved", description: "Summary updated successfully." });
      setEditingItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">Manage News Summaries</h1>
          </div>
          <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Weekly Summary
          </Button>
        </div>

        <p className="text-muted-foreground mb-6">
          AI-generated weekly summaries about EHDS developments. Generate new summaries, edit content, and publish to make them visible to users.
        </p>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : summaries && summaries.length > 0 ? (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Card key={summary.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{summary.title}</CardTitle>
                      <CardDescription>
                        Week: {format(new Date(summary.week_start), 'MMM d')} - {format(new Date(summary.week_end), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={summary.is_published ? "default" : "secondary"}>
                        {summary.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">
                        {summary.generated_by === 'ai' ? 'AI' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {summary.summary.substring(0, 200)}...
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(summary)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(summary)}
                      disabled={updateMutation.isPending}
                    >
                      {summary.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Publish
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Summary?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this news summary. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(summary.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Summaries Yet</h3>
              <p className="text-muted-foreground mb-4">
                Click "Generate Weekly Summary" to create your first AI-generated news summary.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Summary</DialogTitle>
            <DialogDescription>
              Edit the title and content of this news summary.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Content (Markdown)</Label>
              <Textarea
                id="summary"
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminNewsPage;

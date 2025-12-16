import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Sparkles, Trash2, Eye, EyeOff, Loader2, Pencil, Settings, Link, Plus, X } from 'lucide-react';
import Layout from '@/components/Layout';
import MarkdownEditor from '@/components/MarkdownEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNewsSummaries, useGenerateNewsSummary, useUpdateNewsSummary, useDeleteNewsSummary, useCreateNewsSummary, NewsSummary } from '@/hooks/useNewsSummaries';
import { usePageContent, useUpdatePageContent } from '@/hooks/usePageContent';

const AdminNewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isEditor } = useAuth();
  const { data: summaries, isLoading } = useNewsSummaries(false);
  const generateMutation = useGenerateNewsSummary();
  const updateMutation = useUpdateNewsSummary();
  const deleteMutation = useDeleteNewsSummary();
  const createMutation = useCreateNewsSummary();

  const { data: promptData, isLoading: promptLoading } = usePageContent('news-prompt');
  const updatePromptMutation = useUpdatePageContent();

  const [editingItem, setEditingItem] = useState<NewsSummary | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editSources, setEditSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');

  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createSummary, setCreateSummary] = useState('');
  const [createSources, setCreateSources] = useState<string[]>([]);
  const [createNewSource, setCreateNewSource] = useState('');
  const [createWeekStart, setCreateWeekStart] = useState('');
  const [createWeekEnd, setCreateWeekEnd] = useState('');

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
    setEditSources(summary.sources || []);
    setNewSource('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    try {
      await updateMutation.mutateAsync({
        id: editingItem.id,
        title: editTitle,
        summary: editSummary,
        sources: editSources,
      });
      toast({ title: "Saved", description: "Summary updated successfully." });
      setEditingItem(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleAddSource = () => {
    if (newSource.trim() && !editSources.includes(newSource.trim())) {
      setEditSources([...editSources, newSource.trim()]);
      setNewSource('');
    }
  };

  const handleRemoveSource = (index: number) => {
    setEditSources(editSources.filter((_, i) => i !== index));
  };

  const openPromptEditor = () => {
    setEditPrompt((promptData?.content as any)?.prompt || '');
    setShowPromptEditor(true);
  };

  const handleSavePrompt = async () => {
    try {
      await updatePromptMutation.mutateAsync({
        id: 'news-prompt',
        title: 'News Summary AI Prompt',
        content: { prompt: editPrompt },
      });
      toast({ title: "Saved", description: "AI prompt updated successfully." });
      setShowPromptEditor(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCreateDialog = () => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    setCreateTitle(`EHDS Weekly Update: ${format(monday, 'MMM d')} - ${format(sunday, 'MMM d, yyyy')}`);
    setCreateSummary('');
    setCreateSources([]);
    setCreateNewSource('');
    setCreateWeekStart(format(monday, 'yyyy-MM-dd'));
    setCreateWeekEnd(format(sunday, 'yyyy-MM-dd'));
    setShowCreateDialog(true);
  };

  const handleAddCreateSource = () => {
    if (createNewSource.trim() && !createSources.includes(createNewSource.trim())) {
      setCreateSources([...createSources, createNewSource.trim()]);
      setCreateNewSource('');
    }
  };

  const handleRemoveCreateSource = (index: number) => {
    setCreateSources(createSources.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createSummary.trim() || !createWeekStart || !createWeekEnd) {
      toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: createTitle,
        summary: createSummary,
        week_start: createWeekStart,
        week_end: createWeekEnd,
        sources: createSources,
        generated_by: 'manual',
        is_published: false,
      });
      toast({ title: "Created", description: "Manual summary created successfully." });
      setShowCreateDialog(false);
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
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={openPromptEditor}>
              <Settings className="h-4 w-4 mr-2" />
              Edit AI Prompt
            </Button>
            <Button variant="outline" onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Manual
            </Button>
            <Button onClick={handleGenerate} disabled={generateMutation.isPending}>
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate with AI
            </Button>
          </div>
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
                      {summary.sources && summary.sources.length > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Link className="h-3 w-3" />
                          {summary.sources.length} sources
                        </Badge>
                      )}
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
              Edit the title, content, and sources of this news summary.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="sources">Sources ({editSources.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content (Markdown)</Label>
                <MarkdownEditor
                  value={editSummary}
                  onChange={setEditSummary}
                  rows={15}
                />
              </div>
            </TabsContent>
            <TabsContent value="sources" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source URLs</Label>
                <p className="text-sm text-muted-foreground">
                  Add URLs that were used as sources for this news summary.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/article"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSource())}
                  />
                  <Button type="button" onClick={handleAddSource} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {editSources.length > 0 ? (
                <div className="space-y-2">
                  {editSources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex-1 truncate"
                      >
                        {source}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveSource(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sources added yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
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

      {/* Prompt Editor Dialog */}
      <Dialog open={showPromptEditor} onOpenChange={setShowPromptEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit AI Prompt</DialogTitle>
            <DialogDescription>
              Customize the prompt used to generate weekly news summaries. The week dates will be automatically appended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>AI Prompt</Label>
              <Textarea
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={20}
                className="font-mono text-sm"
                placeholder="Enter the prompt for AI news generation..."
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Tip: Include instructions for the AI to add source URLs in markdown format like [Source Name](URL).
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPromptEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePrompt} disabled={updatePromptMutation.isPending}>
              {updatePromptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Prompt
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Manual Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Manual Summary</DialogTitle>
            <DialogDescription>
              Create a news summary manually without AI generation.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="sources">Sources ({createSources.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="content" className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-week-start">Week Start</Label>
                  <Input
                    id="create-week-start"
                    type="date"
                    value={createWeekStart}
                    onChange={(e) => setCreateWeekStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-week-end">Week End</Label>
                  <Input
                    id="create-week-end"
                    type="date"
                    value={createWeekEnd}
                    onChange={(e) => setCreateWeekEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-title">Title</Label>
                <Input
                  id="create-title"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Content (Markdown)</Label>
                <MarkdownEditor
                  value={createSummary}
                  onChange={setCreateSummary}
                  rows={15}
                />
              </div>
            </TabsContent>
            <TabsContent value="sources" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source URLs</Label>
                <p className="text-sm text-muted-foreground">
                  Add URLs that were used as sources for this news summary.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/article"
                    value={createNewSource}
                    onChange={(e) => setCreateNewSource(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCreateSource())}
                  />
                  <Button type="button" onClick={handleAddCreateSource} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {createSources.length > 0 ? (
                <div className="space-y-2">
                  {createSources.map((source, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Link className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex-1 truncate"
                      >
                        {source}
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveCreateSource(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sources added yet.
                </p>
              )}
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Summary
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default AdminNewsPage;

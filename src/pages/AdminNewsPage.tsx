import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, Sparkles, Trash2, Eye, EyeOff, Loader2, Pencil, Settings, Link, Plus, X, Globe, FileText, Rocket } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNewsSummaries, useGenerateNewsSummary, useGenerateProductUpdates, useUpdateNewsSummary, useDeleteNewsSummary, useCreateNewsSummary, NewsSummary } from '@/hooks/useNewsSummaries';
import { usePageContent, useUpdatePageContent } from '@/hooks/usePageContent';
import { supabase } from '@/integrations/supabase/client';

const AdminNewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, isEditor } = useAuth();
  const { data: summaries, isLoading } = useNewsSummaries(false);
  const generateMutation = useGenerateNewsSummary();
  const generateProductUpdatesMutation = useGenerateProductUpdates();
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

  // Firecrawl scraping state
  const [showScrapeDialog, setShowScrapeDialog] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [scrapedContent, setScrapedContent] = useState<{ title: string; markdown: string; url: string } | null>(null);
  const [scrapedUrls, setScrapedUrls] = useState<Array<{ url: string; title: string; markdown: string }>>([]);

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

  const handleGenerateProductUpdates = async () => {
    try {
      // Import the changelog content directly
      const changelogModule = await import('/CHANGELOG.md?raw');
      const changelog = changelogModule.default || '';
      
      if (!changelog) {
        throw new Error("Could not load changelog content");
      }
      
      const result = await generateProductUpdatesMutation.mutateAsync(changelog);
      toast({
        title: "Product Updates Generated",
        description: result.message || "Product updates summary has been generated. Review and publish it.",
      });
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate product updates. Please try again.",
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
      setScrapedUrls([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return;
    
    setIsScrapingUrl(true);
    setScrapedContent(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
        body: { url: scrapeUrl, options: { formats: ['markdown'] } },
      });
      
      if (error) throw error;
      
      if (!data.success && data.error) {
        throw new Error(data.error);
      }
      
      const markdown = data.data?.markdown || data.markdown || '';
      const title = data.data?.metadata?.title || data.metadata?.title || scrapeUrl;
      
      setScrapedContent({ title, markdown, url: scrapeUrl });
      toast({ title: "Scraped", description: "URL content extracted successfully." });
    } catch (error: any) {
      console.error('Scrape error:', error);
      toast({ 
        title: "Scraping failed", 
        description: error.message || "Failed to scrape URL. Make sure Firecrawl is connected.", 
        variant: "destructive" 
      });
    } finally {
      setIsScrapingUrl(false);
    }
  };

  const handleAddScrapedContent = () => {
    if (!scrapedContent) return;
    
    // Add to scraped URLs list
    setScrapedUrls([...scrapedUrls, scrapedContent]);
    
    // Add URL to sources
    if (!createSources.includes(scrapedContent.url)) {
      setCreateSources([...createSources, scrapedContent.url]);
    }
    
    // Clear scrape dialog
    setScrapedContent(null);
    setScrapeUrl('');
    setShowScrapeDialog(false);
    
    toast({ title: "Added", description: "Content added to your sources." });
  };

  const handleRemoveScrapedUrl = (index: number) => {
    const removed = scrapedUrls[index];
    setScrapedUrls(scrapedUrls.filter((_, i) => i !== index));
    setCreateSources(createSources.filter(s => s !== removed.url));
  };

  const handleInsertScrapedContent = (content: typeof scrapedUrls[0]) => {
    const insertion = `\n\n### ${content.title}\n\n${content.markdown.substring(0, 500)}...\n\n[Read more](${content.url})`;
    setCreateSummary(createSummary + insertion);
    toast({ title: "Inserted", description: "Content excerpt added to summary." });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">
        {/* Header - Stack on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold truncate">Manage News Summaries</h1>
          </div>
          
          {/* Action buttons - wrap on mobile */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={openPromptEditor} className="text-xs sm:text-sm">
              <Settings className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Edit AI Prompt</span>
            </Button>
            <Button variant="outline" size="sm" onClick={openCreateDialog} className="text-xs sm:text-sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Create Manual</span>
            </Button>
            <Button size="sm" onClick={handleGenerate} disabled={generateMutation.isPending} className="text-xs sm:text-sm">
              {generateMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">EHDS News</span>
            </Button>
            <Button 
              size="sm"
              onClick={handleGenerateProductUpdates} 
              disabled={generateProductUpdatesMutation.isPending}
              variant="secondary"
              className="text-xs sm:text-sm"
            >
              {generateProductUpdatesMutation.isPending ? (
                <Loader2 className="h-4 w-4 sm:mr-2 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4 sm:mr-2" />
              )}
              <span className="hidden sm:inline">Explorer Updates</span>
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
              <Card key={summary.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  {/* Stack layout on mobile, row on desktop */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg break-words">{summary.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Week: {format(new Date(summary.week_start), 'MMM d')} - {format(new Date(summary.week_end), 'MMM d, yyyy')}
                      </CardDescription>
                    </div>
                    {/* Badges wrap on mobile */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {summary.sources && summary.sources.length > 0 && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Link className="h-3 w-3" />
                          {summary.sources.length}
                        </Badge>
                      )}
                      <Badge variant={summary.is_published ? "default" : "secondary"} className="text-xs">
                        {summary.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {summary.generated_by === 'ai' ? 'EHDS News' : 
                         summary.generated_by === 'product_update' ? 'Explorer Updates' : 'Manual'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {summary.summary.substring(0, 200)}...
                  </p>
                  {/* Action buttons wrap on mobile */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(summary)} className="text-xs sm:text-sm">
                      <Pencil className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTogglePublish(summary)}
                      disabled={updateMutation.isPending}
                      className="text-xs sm:text-sm"
                    >
                      {summary.is_published ? (
                        <>
                          <EyeOff className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Publish</span>
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive text-xs sm:text-sm">
                          <Trash2 className="h-4 w-4 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
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
              Create a news summary manually. Use "Scrape Sources" to pull content from EHDS-related URLs.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="scrape">Scrape Sources ({scrapedUrls.length})</TabsTrigger>
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
            <TabsContent value="scrape" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Scrape EHDS-Related URLs</Label>
                <p className="text-sm text-muted-foreground">
                  Enter a URL to scrape its content. You can then insert excerpts into your summary.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://health.ec.europa.eu/news/..."
                    value={scrapeUrl}
                    onChange={(e) => setScrapeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleScrapeUrl())}
                  />
                  <Button 
                    type="button" 
                    onClick={handleScrapeUrl}
                    disabled={isScrapingUrl || !scrapeUrl.trim()}
                  >
                    {isScrapingUrl ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Globe className="h-4 w-4 mr-2" />
                    )}
                    Scrape
                  </Button>
                </div>
              </div>

              {scrapedContent && (
                <Card className="border-primary/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{scrapedContent.title}</CardTitle>
                    <CardDescription className="truncate">{scrapedContent.url}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px] mb-4">
                      <pre className="text-xs whitespace-pre-wrap font-sans">
                        {scrapedContent.markdown.substring(0, 2000)}
                        {scrapedContent.markdown.length > 2000 && '...'}
                      </pre>
                    </ScrollArea>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setScrapedContent(null)}>
                        Discard
                      </Button>
                      <Button size="sm" onClick={handleAddScrapedContent}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add to Sources
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {scrapedUrls.length > 0 && (
                <div className="space-y-2">
                  <Label>Scraped Content</Label>
                  {scrapedUrls.map((item, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleInsertScrapedContent(item)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Insert
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveScrapedUrl(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {scrapedUrls.length === 0 && !scrapedContent && (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Scrape URLs to pull EHDS-related news content</p>
                </div>
              )}
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

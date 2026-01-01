import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useChapters } from '@/hooks/useChapters';
import { useSections } from '@/hooks/useSections';
import { useFootnotes, useCreateFootnote, useUpdateFootnote, useDeleteFootnote, Footnote } from '@/hooks/useFootnotes';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface DbArticle {
  id: number;
  article_number: number;
  title: string;
  content: string;
  chapter_id: number | null;
  section_id: number | null;
  created_at: string;
  updated_at: string;
}

const AdminArticlesPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingArticle, setEditingArticle] = useState<DbArticle | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedChapterId, setEditedChapterId] = useState<number | null>(null);
  const [editedSectionId, setEditedSectionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk selection state
  const [selectedArticles, setSelectedArticles] = useState<Set<number>>(new Set());
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkChapterId, setBulkChapterId] = useState<number | null>(null);
  const [bulkSectionId, setBulkSectionId] = useState<number | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const { data: chapters } = useChapters();
  const { data: allSections } = useSections();
  const { data: allFootnotes = [] } = useFootnotes();
  const createFootnote = useCreateFootnote();
  const updateFootnote = useUpdateFootnote();
  const deleteFootnote = useDeleteFootnote();

  // Footnote management state
  const [newFootnoteMarker, setNewFootnoteMarker] = useState('');
  const [newFootnoteContent, setNewFootnoteContent] = useState('');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('article_number', { ascending: true });
      
      if (error) throw error;
      return data as DbArticle[];
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

  const filteredArticles = articles?.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.article_number.toString().includes(searchQuery)
  ) || [];

  const handleEdit = (article: DbArticle) => {
    setEditingArticle(article);
    setEditedTitle(article.title);
    setEditedContent(article.content);
    setEditedChapterId(article.chapter_id);
    setEditedSectionId(article.section_id);
    setNewFootnoteMarker('');
    setNewFootnoteContent('');
  };

  // Get footnotes for the currently editing article
  const articleFootnotes = editingArticle 
    ? allFootnotes.filter(fn => fn.article_id === editingArticle.id)
    : [];

  // Get sections filtered by selected chapter
  const availableSections = allSections?.filter(s => s.chapter_id === editedChapterId) || [];
  const bulkAvailableSections = allSections?.filter(s => s.chapter_id === bulkChapterId) || [];

  const handleSave = async () => {
    if (!editingArticle) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          title: editedTitle, 
          content: editedContent,
          chapter_id: editedChapterId,
          section_id: editedSectionId,
        })
        .eq('id', editingArticle.id);

      if (error) throw error;

      toast({
        title: 'Article Updated',
        description: `Article ${editingArticle.article_number} has been saved.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setEditingArticle(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save article',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFootnote = async () => {
    if (!editingArticle || !newFootnoteMarker || !newFootnoteContent) return;
    try {
      await createFootnote.mutateAsync({
        marker: newFootnoteMarker,
        content: newFootnoteContent,
        article_id: editingArticle.id,
        recital_id: null,
      });
      setNewFootnoteMarker('');
      setNewFootnoteContent('');
      toast({ title: 'Footnote added' });
    } catch {
      toast({ title: 'Error', description: 'Failed to add footnote', variant: 'destructive' });
    }
  };

  const handleDeleteFootnote = async (id: string) => {
    if (!confirm('Delete this footnote?')) return;
    try {
      await deleteFootnote.mutateAsync(id);
      toast({ title: 'Footnote deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete footnote', variant: 'destructive' });
    }
  };

  // Bulk selection handlers
  const toggleArticleSelection = (articleId: number) => {
    setSelectedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    setSelectedArticles(new Set(filteredArticles.map(a => a.id)));
  };

  const clearSelection = () => {
    setSelectedArticles(new Set());
  };

  const openBulkDialog = () => {
    setBulkChapterId(null);
    setBulkSectionId(null);
    setBulkDialogOpen(true);
  };

  const handleBulkAssign = async () => {
    if (selectedArticles.size === 0) return;

    setIsBulkSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          chapter_id: bulkChapterId,
          section_id: bulkSectionId,
        })
        .in('id', Array.from(selectedArticles));

      if (error) throw error;

      toast({
        title: 'Bulk Update Complete',
        description: `${selectedArticles.size} articles have been assigned.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setBulkDialogOpen(false);
      setSelectedArticles(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update articles',
        variant: 'destructive',
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Get chapter/section info for display
  const getChapterName = (chapterId: number | null) => {
    if (!chapterId) return null;
    const chapter = chapters?.find(c => c.id === chapterId);
    return chapter ? `Ch. ${chapter.chapter_number}` : null;
  };

  const getSectionName = (sectionId: number | null) => {
    if (!sectionId) return null;
    const section = allSections?.find(s => s.id === sectionId);
    return section ? `S. ${section.section_number}` : null;
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
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">Manage Articles</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Edit article titles, content, and assignments</p>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles by number, title, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={selectAllFiltered} className="text-xs sm:text-sm">
                <CheckSquare className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Select All</span> ({filteredArticles.length})
              </Button>
              {selectedArticles.size > 0 && (
                <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs sm:text-sm">
                  <X className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Clear</span>
                </Button>
              )}
            </div>
            {selectedArticles.size > 0 && (
              <div className="flex items-center gap-2 sm:ml-auto">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedArticles.size} selected
                </span>
                <Button onClick={openBulkDialog} size="sm" className="text-xs sm:text-sm">
                  Assign Chapter/Section
                </Button>
              </div>
            )}
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
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article) => (
              <Card 
                key={article.id} 
                className={`hover:border-primary/50 transition-colors ${selectedArticles.has(article.id) ? 'border-primary bg-primary/5' : ''}`}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Checkbox
                      checked={selectedArticles.has(article.id)}
                      onCheckedChange={() => toggleArticleSelection(article.id)}
                      className="mt-1 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">Art. {article.article_number}</Badge>
                        {getChapterName(article.chapter_id) && (
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                            {getChapterName(article.chapter_id)}
                          </Badge>
                        )}
                        {getSectionName(article.section_id) && (
                          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
                            {getSectionName(article.section_id)}
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-sm sm:text-base line-clamp-1">{article.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 hidden sm:block">
                        {article.content.substring(0, 150)}...
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(article)} className="shrink-0">
                      <Edit className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Single Article Edit Dialog */}
        <Dialog open={!!editingArticle} onOpenChange={() => setEditingArticle(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Article {editingArticle?.article_number}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select
                    value={editedChapterId?.toString() || "none"}
                    onValueChange={(value) => {
                      const newChapterId = value === "none" ? null : parseInt(value);
                      setEditedChapterId(newChapterId);
                      // Reset section if chapter changes
                      if (newChapterId !== editedChapterId) {
                        setEditedSectionId(null);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No chapter</SelectItem>
                      {chapters?.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id.toString()}>
                          Chapter {ch.chapter_number}: {ch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={editedSectionId?.toString() || "none"}
                    onValueChange={(value) => setEditedSectionId(value === "none" ? null : parseInt(value))}
                    disabled={!editedChapterId || availableSections.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!editedChapterId ? "Select chapter first" : "Select section"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No section</SelectItem>
                      {availableSections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id.toString()}>
                          Section {sec.section_number}: {sec.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Content</Label>
                <MarkdownEditor
                  value={editedContent}
                  onChange={setEditedContent}
                  rows={12}
                />
              </div>
              
              {/* Footnotes Section */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <StickyNote className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-base font-medium">Footnotes ({articleFootnotes.length})</Label>
                </div>
                
                {articleFootnotes.length > 0 && (
                  <div className="space-y-2">
                    {articleFootnotes.map((fn) => (
                      <div key={fn.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm">
                        <span className="font-mono text-primary shrink-0">{fn.marker}</span>
                        <p className="flex-1 text-muted-foreground">{fn.content}</p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteFootnote(fn.id)}
                          className="shrink-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="grid gap-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Marker (e.g. [^1])"
                      value={newFootnoteMarker}
                      onChange={(e) => setNewFootnoteMarker(e.target.value)}
                      className="w-32"
                    />
                    <Textarea
                      placeholder="Footnote content..."
                      value={newFootnoteContent}
                      onChange={(e) => setNewFootnoteContent(e.target.value)}
                      rows={2}
                      className="flex-1"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddFootnote}
                    disabled={!newFootnoteMarker || !newFootnoteContent || createFootnote.isPending}
                    className="w-fit"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Footnote
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingArticle(null)}>
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

        {/* Bulk Assignment Dialog */}
        <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Assign Chapter & Section</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Assign {selectedArticles.size} selected article{selectedArticles.size > 1 ? 's' : ''} to a chapter and section.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Chapter</Label>
                  <Select
                    value={bulkChapterId?.toString() || "none"}
                    onValueChange={(value) => {
                      const newChapterId = value === "none" ? null : parseInt(value);
                      setBulkChapterId(newChapterId);
                      setBulkSectionId(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No chapter</SelectItem>
                      {chapters?.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id.toString()}>
                          Chapter {ch.chapter_number}: {ch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select
                    value={bulkSectionId?.toString() || "none"}
                    onValueChange={(value) => setBulkSectionId(value === "none" ? null : parseInt(value))}
                    disabled={!bulkChapterId || bulkAvailableSections.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!bulkChapterId ? "Select chapter first" : bulkAvailableSections.length === 0 ? "No sections in chapter" : "Select section"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No section</SelectItem>
                      {bulkAvailableSections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id.toString()}>
                          Section {sec.section_number}: {sec.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBulkAssign} disabled={isBulkSaving}>
                  {isBulkSaving ? 'Saving...' : `Assign ${selectedArticles.size} Articles`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default AdminArticlesPage;

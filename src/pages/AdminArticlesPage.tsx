import { useState, useMemo } from 'react';
import { Search, Edit, Save, X, CheckSquare } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useChapters } from '@/hooks/useChapters';
import { useSections } from '@/hooks/useSections';
import { useFootnotes } from '@/hooks/useFootnotes';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { AdminPageLayout, AdminPageLoading } from '@/components/admin/AdminPageLayout';
import { FootnoteManager } from '@/components/admin/FootnoteManager';

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
  const { shouldRender, user, isEditor } = useAdminGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingArticle, setEditingArticle] = useState<DbArticle | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedChapterId, setEditedChapterId] = useState<number | null>(null);
  const [editedSectionId, setEditedSectionId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bulk assignment state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkChapterId, setBulkChapterId] = useState<number | null>(null);
  const [bulkSectionId, setBulkSectionId] = useState<number | null>(null);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const { data: chapters } = useChapters();
  const { data: allSections } = useSections();
  const { data: allFootnotes = [] } = useFootnotes();

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

  const filteredArticles = useMemo(() => 
    articles?.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.article_number.toString().includes(searchQuery)
    ) || [],
    [articles, searchQuery]
  );

  const {
    selectedCount,
    selectedArray,
    isSelected,
    toggle,
    selectAll,
    clearSelection,
  } = useBulkSelection(filteredArticles.map((a) => a.id));

  const handleEdit = (article: DbArticle) => {
    setEditingArticle(article);
    setEditedTitle(article.title);
    setEditedContent(article.content);
    setEditedChapterId(article.chapter_id);
    setEditedSectionId(article.section_id);
  };

  const articleFootnotes = editingArticle 
    ? allFootnotes.filter(fn => fn.article_id === editingArticle.id)
    : [];

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

  const openBulkDialog = () => {
    setBulkChapterId(null);
    setBulkSectionId(null);
    setBulkDialogOpen(true);
  };

  const handleBulkAssign = async () => {
    if (selectedCount === 0) return;

    setIsBulkSaving(true);
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          chapter_id: bulkChapterId,
          section_id: bulkSectionId,
        })
        .in('id', selectedArray);

      if (error) throw error;

      toast({
        title: 'Bulk Update Complete',
        description: `${selectedCount} articles have been assigned.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setBulkDialogOpen(false);
      clearSelection();
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

  if (!shouldRender) {
    return <AdminPageLoading />;
  }

  return (
    <AdminPageLayout
      title="Manage Articles"
      description="Edit article titles, content, and assignments"
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search articles by number, title, or content..."
    >
      {/* Bulk Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAll} className="text-xs sm:text-sm">
            <CheckSquare className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Select All</span> ({filteredArticles.length})
          </Button>
          {selectedCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearSelection} className="text-xs sm:text-sm">
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-xs sm:text-sm text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button onClick={openBulkDialog} size="sm" className="text-xs sm:text-sm">
              Assign Chapter/Section
            </Button>
          </div>
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
        <div className="space-y-2">
          {filteredArticles.map((article) => (
            <Card 
              key={article.id} 
              className={`hover:border-primary/50 transition-colors ${isSelected(article.id) ? 'border-primary bg-primary/5' : ''}`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <Checkbox
                    checked={isSelected(article.id)}
                    onCheckedChange={() => toggle(article.id)}
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
            
            <FootnoteManager
              footnotes={articleFootnotes}
              articleId={editingArticle?.id}
            />

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
              Assign {selectedCount} selected article{selectedCount > 1 ? 's' : ''} to a chapter and section.
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
                {isBulkSaving ? 'Saving...' : `Assign ${selectedCount} Articles`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
};

export default AdminArticlesPage;

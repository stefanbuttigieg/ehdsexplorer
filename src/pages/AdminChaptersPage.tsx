import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useChapters, useCreateChapter, useUpdateChapter, useDeleteChapter, Chapter } from '@/hooks/useChapters';
import { useSections, useCreateSection, useUpdateSection, useDeleteSection, Section } from '@/hooks/useSections';

const AdminChaptersPage = () => {
  const { user, loading, isEditor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: chapters, isLoading: chaptersLoading } = useChapters();
  const { data: sections, isLoading: sectionsLoading } = useSections();

  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();

  const createSection = useCreateSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();

  const [expandedChapters, setExpandedChapters] = useState<number[]>([]);

  // Chapter dialog state
  const [chapterDialogOpen, setChapterDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ chapter_number: '', title: '', description: '' });

  // Section dialog state
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [sectionChapterId, setSectionChapterId] = useState<number | null>(null);
  const [sectionForm, setSectionForm] = useState({ section_number: '', title: '' });

  // Delete confirmation state
  const [deleteChapterId, setDeleteChapterId] = useState<number | null>(null);
  const [deleteSectionId, setDeleteSectionId] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/admin/auth');
    } else if (!loading && user && !isEditor) {
      navigate('/');
    }
  }, [user, loading, isEditor, navigate]);

  const toggleChapter = (chapterId: number) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const openChapterDialog = (chapter?: Chapter) => {
    if (chapter) {
      setEditingChapter(chapter);
      setChapterForm({
        chapter_number: chapter.chapter_number.toString(),
        title: chapter.title,
        description: chapter.description || '',
      });
    } else {
      setEditingChapter(null);
      const nextNumber = chapters?.length ? Math.max(...chapters.map((c) => c.chapter_number)) + 1 : 1;
      setChapterForm({ chapter_number: nextNumber.toString(), title: '', description: '' });
    }
    setChapterDialogOpen(true);
  };

  const openSectionDialog = (chapterId: number, section?: Section) => {
    setSectionChapterId(chapterId);
    if (section) {
      setEditingSection(section);
      setSectionForm({
        section_number: section.section_number.toString(),
        title: section.title,
      });
    } else {
      setEditingSection(null);
      const chapterSections = sections?.filter((s) => s.chapter_id === chapterId) || [];
      const nextNumber = chapterSections.length ? Math.max(...chapterSections.map((s) => s.section_number)) + 1 : 1;
      setSectionForm({ section_number: nextNumber.toString(), title: '' });
    }
    setSectionDialogOpen(true);
  };

  const handleSaveChapter = async () => {
    const chapter_number = parseInt(chapterForm.chapter_number);
    if (isNaN(chapter_number) || !chapterForm.title.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      if (editingChapter) {
        await updateChapter.mutateAsync({
          id: editingChapter.id,
          chapter_number,
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || null,
        });
        toast({ title: 'Chapter Updated' });
      } else {
        await createChapter.mutateAsync({
          chapter_number,
          title: chapterForm.title.trim(),
          description: chapterForm.description.trim() || null,
        });
        toast({ title: 'Chapter Created' });
      }
      setChapterDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveSection = async () => {
    const section_number = parseInt(sectionForm.section_number);
    if (isNaN(section_number) || !sectionForm.title.trim() || !sectionChapterId) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      if (editingSection) {
        await updateSection.mutateAsync({
          id: editingSection.id,
          section_number,
          title: sectionForm.title.trim(),
        });
        toast({ title: 'Section Updated' });
      } else {
        await createSection.mutateAsync({
          chapter_id: sectionChapterId,
          section_number,
          title: sectionForm.title.trim(),
        });
        toast({ title: 'Section Created' });
      }
      setSectionDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteChapter = async () => {
    if (!deleteChapterId) return;
    try {
      await deleteChapter.mutateAsync(deleteChapterId);
      toast({ title: 'Chapter Deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setDeleteChapterId(null);
  };

  const handleDeleteSection = async () => {
    if (!deleteSectionId) return;
    try {
      await deleteSection.mutateAsync(deleteSectionId);
      toast({ title: 'Section Deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setDeleteSectionId(null);
  };

  const getSectionsForChapter = (chapterId: number) => {
    return sections?.filter((s) => s.chapter_id === chapterId) || [];
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

  const isLoading = chaptersLoading || sectionsLoading;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">Manage Chapters & Sections</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Organize the regulation structure</p>
          </div>
          <Button onClick={() => openChapterDialog()} size="sm" className="self-start sm:self-auto">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Chapter</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : chapters?.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No chapters yet. Create your first chapter to get started.</p>
              <Button onClick={() => openChapterDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Create Chapter
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {chapters?.map((chapter) => {
              const chapterSections = getSectionsForChapter(chapter.id);
              const isExpanded = expandedChapters.includes(chapter.id);

              return (
                <Card key={chapter.id}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleChapter(chapter.id)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CollapsibleTrigger className="flex items-start gap-3 text-left flex-1">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground" />
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">Chapter {chapter.chapter_number}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {chapterSections.length} section{chapterSections.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{chapter.title}</CardTitle>
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground mt-1">{chapter.description}</p>
                            )}
                          </div>
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openChapterDialog(chapter)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteChapterId(chapter.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="border-t pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">Sections</h4>
                            <Button variant="outline" size="sm" onClick={() => openSectionDialog(chapter.id)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Section
                            </Button>
                          </div>
                          {chapterSections.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-2">
                              No sections in this chapter yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {chapterSections.map((section) => (
                                <div
                                  key={section.id}
                                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                >
                                  <div>
                                    <Badge variant="secondary" className="mr-2">
                                      Section {section.section_number}
                                    </Badge>
                                    <span className="text-sm">{section.title}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => openSectionDialog(chapter.id, section)}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setDeleteSectionId(section.id)}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        )}

        {/* Chapter Dialog */}
        <Dialog open={chapterDialogOpen} onOpenChange={setChapterDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChapter ? 'Edit Chapter' : 'Add Chapter'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Chapter Number</Label>
                <Input
                  type="number"
                  value={chapterForm.chapter_number}
                  onChange={(e) => setChapterForm((f) => ({ ...f, chapter_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={chapterForm.title}
                  onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., General Provisions"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={chapterForm.description}
                  onChange={(e) => setChapterForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the chapter..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChapterDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveChapter}
                disabled={createChapter.isPending || updateChapter.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Section Dialog */}
        <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSection ? 'Edit Section' : 'Add Section'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Section Number</Label>
                <Input
                  type="number"
                  value={sectionForm.section_number}
                  onChange={(e) => setSectionForm((f) => ({ ...f, section_number: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={sectionForm.title}
                  onChange={(e) => setSectionForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Rights of natural persons"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveSection}
                disabled={createSection.isPending || updateSection.isPending}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Chapter Confirmation */}
        <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter?</AlertDialogTitle>
              <AlertDialogDescription>
                This will also delete all sections within this chapter. Articles will be unassigned. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChapter} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Section Confirmation */}
        <AlertDialog open={!!deleteSectionId} onOpenChange={() => setDeleteSectionId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Section?</AlertDialogTitle>
              <AlertDialogDescription>
                Articles in this section will be unassigned but not deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
};

export default AdminChaptersPage;

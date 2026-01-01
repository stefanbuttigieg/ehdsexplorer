import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pin, PinOff, Trash2, Tag, StickyNote, Cloud, HardDrive, Download, FileJson, FileText, Copy, Highlighter } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useUserNotes, UserNote, RelatedContent } from '@/hooks/useUserNotes';
import { useAnnotations, useAnnotationTags, Annotation } from '@/hooks/useAnnotations';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';

// Export helper functions
const formatNoteAsMarkdown = (note: UserNote): string => {
  let md = `# ${note.title}\n\n`;
  if (note.tags.length > 0) {
    md += `**Tags:** ${note.tags.join(', ')}\n\n`;
  }
  md += `${note.content}\n\n`;
  md += `---\n`;
  md += `Created: ${format(new Date(note.created_at), 'yyyy-MM-dd HH:mm')}\n`;
  md += `Updated: ${format(new Date(note.updated_at), 'yyyy-MM-dd HH:mm')}\n`;
  return md;
};

const formatAnnotationAsMarkdown = (annotation: Annotation): string => {
  let md = `## Annotation\n\n`;
  md += `> "${annotation.selected_text}"\n\n`;
  if (annotation.comment) {
    md += `**Comment:** ${annotation.comment}\n\n`;
  }
  md += `**Source:** ${annotation.content_type} ${annotation.content_id}\n`;
  md += `**Highlighted:** ${annotation.highlight_color}\n`;
  md += `**Created:** ${format(new Date(annotation.created_at), 'yyyy-MM-dd HH:mm')}\n`;
  return md;
};

const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const NotesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string; tags: string[] } | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const { notes, isLoading, createNote, updateNote, deleteNote, isLoggedIn } = useUserNotes();
  const { annotations } = useAnnotations();
  const { tags, createTag, deleteTag } = useAnnotationTags();

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote.mutateAsync({
        title: 'Untitled Note',
        content: '',
      });
      setSelectedNote(newNote);
      setEditingNote({ id: newNote.id, title: newNote.title, content: newNote.content, tags: newNote.tags });
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;
    
    try {
      await updateNote.mutateAsync({
        id: editingNote.id,
        title: editingNote.title,
        content: editingNote.content,
        tags: editingNote.tags,
      });
      setEditingNote(null);
      toast.success('Note saved');
    } catch (error) {
      toast.error('Failed to save note');
    }
  };

  const handleTogglePin = async (note: UserNote) => {
    try {
      await updateNote.mutateAsync({
        id: note.id,
        is_pinned: !note.is_pinned,
      });
    } catch (error) {
      toast.error('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote.mutateAsync(noteId);
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setEditingNote(null);
      }
      toast.success('Note deleted');
    } catch (error) {
      toast.error('Failed to delete note');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
      setNewTagName('');
      toast.success('Tag created');
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      await deleteTag.mutateAsync(tagId);
      toast.success('Tag deleted');
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  const selectNote = (note: UserNote) => {
    if (editingNote) {
      handleSaveNote();
    }
    setSelectedNote(note);
    setEditingNote({ id: note.id, title: note.title, content: note.content, tags: note.tags });
  };

  // Export functions
  const exportAllAsMarkdown = () => {
    let content = `# EHDS Explorer Notes & Annotations\n\nExported: ${format(new Date(), 'yyyy-MM-dd HH:mm')}\n\n`;
    
    if (notes.length > 0) {
      content += `## Notes\n\n`;
      notes.forEach(note => {
        content += formatNoteAsMarkdown(note) + '\n\n';
      });
    }
    
    if (annotations.length > 0) {
      content += `## Annotations\n\n`;
      annotations.forEach(ann => {
        content += formatAnnotationAsMarkdown(ann) + '\n\n';
      });
    }
    
    downloadFile(content, `ehds-notes-${format(new Date(), 'yyyy-MM-dd')}.md`, 'text/markdown');
    toast.success('Exported as Markdown');
  };

  const exportAllAsJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      notes: notes,
      annotations: annotations,
    };
    downloadFile(JSON.stringify(data, null, 2), `ehds-notes-${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json');
    toast.success('Exported as JSON');
  };

  const exportForNotion = () => {
    // Notion import format (Markdown with YAML frontmatter)
    let content = '';
    notes.forEach(note => {
      content += `---\ntitle: "${note.title}"\ntags: [${note.tags.map(t => `"${t}"`).join(', ')}]\ncreated: ${note.created_at}\n---\n\n`;
      content += `${note.content}\n\n---\n\n`;
    });
    downloadFile(content, `ehds-notes-notion-${format(new Date(), 'yyyy-MM-dd')}.md`, 'text/markdown');
    toast.success('Exported for Notion (import as Markdown)');
  };

  const exportForObsidian = () => {
    // Obsidian format with wikilinks and tags
    let content = '';
    notes.forEach(note => {
      const tags = note.tags.map(t => `#${t.replace(/\s+/g, '-')}`).join(' ');
      content += `# ${note.title}\n\n${tags}\n\n${note.content}\n\n`;
      content += `Created: [[${format(new Date(note.created_at), 'yyyy-MM-dd')}]]\n\n---\n\n`;
    });
    downloadFile(content, `ehds-notes-obsidian-${format(new Date(), 'yyyy-MM-dd')}.md`, 'text/markdown');
    toast.success('Exported for Obsidian');
  };

  const copySelectedNoteAsMarkdown = () => {
    if (!selectedNote) return;
    const markdown = formatNoteAsMarkdown(selectedNote);
    navigator.clipboard.writeText(markdown);
    toast.success('Copied to clipboard');
  };

  return (
    <Layout>
      <Helmet>
        <title>Notes | EHDS Explorer</title>
        <meta name="description" content="Your personal notes and annotations for the EHDS Regulation" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold font-serif">Notes</h1>
            <p className="text-muted-foreground mt-1">
              Your personal notes and annotations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              {isLoggedIn ? (
                <>
                  <Cloud className="h-3 w-3" />
                  Synced
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" />
                  Local only
                </>
              )}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export All</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportAllAsMarkdown}>
                  <FileText className="h-4 w-4 mr-2" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAllAsJson}>
                  <FileJson className="h-4 w-4 mr-2" />
                  JSON (.json)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>For Note-Taking Apps</DropdownMenuLabel>
                <DropdownMenuItem onClick={exportForNotion}>
                  <FileText className="h-4 w-4 mr-2" />
                  Notion (Markdown)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportForObsidian}>
                  <FileText className="h-4 w-4 mr-2" />
                  Obsidian (Markdown)
                </DropdownMenuItem>
                {selectedNote && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Current Note</DropdownMenuLabel>
                    <DropdownMenuItem onClick={copySelectedNoteAsMarkdown}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy as Markdown
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Dialog open={showTagManager} onOpenChange={setShowTagManager}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="h-4 w-4 mr-2" />
                  Manage Tags
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Tags</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="New tag name..."
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                    <input
                      type="color"
                      value={newTagColor}
                      onChange={(e) => setNewTagColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Button onClick={handleCreateTag}>Add</Button>
                  </div>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center justify-between p-2 rounded bg-muted">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: tag.color }} 
                          />
                          <span>{tag.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No tags yet. Create one above!
                      </p>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={handleCreateNote}>
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary',
                      selectedNote?.id === note.id && 'border-primary bg-primary/5'
                    )}
                    onClick={() => selectNote(note)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {note.is_pinned && <Pin className="h-3 w-3 text-primary" />}
                            <h3 className="font-medium truncate">{note.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {note.content || 'No content'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.updated_at), 'MMM d, yyyy')}
                            </span>
                            {note.tags.length > 0 && (
                              <div className="flex gap-1">
                                {note.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {note.tags.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{note.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No notes match your search' : 'No notes yet'}
                    </p>
                    <Button onClick={handleCreateNote} variant="link" className="mt-2">
                      Create your first note
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* All Annotations */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Highlighter className="h-4 w-4" />
                  Annotations ({annotations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 max-h-64 overflow-y-auto space-y-2">
                {annotations.length > 0 ? (
                  annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-2 rounded border border-border hover:border-primary/50 transition-colors"
                    >
                      <Link
                        to={`/${ann.content_type === 'implementing_act' ? 'implementing-acts' : ann.content_type + 's'}/${ann.content_id}`}
                        className="block"
                      >
                        <div
                          className={cn(
                            'text-sm font-medium px-1 rounded inline-block',
                            ann.highlight_color === 'yellow' && 'bg-yellow-200/70 dark:bg-yellow-300/40',
                            ann.highlight_color === 'green' && 'bg-green-200/70 dark:bg-green-300/40',
                            ann.highlight_color === 'blue' && 'bg-blue-200/70 dark:bg-blue-300/40',
                            ann.highlight_color === 'pink' && 'bg-pink-200/70 dark:bg-pink-300/40',
                            ann.highlight_color === 'orange' && 'bg-orange-200/70 dark:bg-orange-300/40'
                          )}
                        >
                          "{ann.selected_text.slice(0, 50)}{ann.selected_text.length > 50 ? '...' : ''}"
                        </div>
                        {ann.comment && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {ann.comment}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs capitalize">
                            {ann.content_type.replace('_', ' ')} {ann.content_id}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(ann.created_at), 'MMM d')}
                          </span>
                        </div>
                      </Link>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet. Select text on articles or recitals to highlight.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Note Editor */}
          <div className="lg:col-span-2">
            {editingNote ? (
              <Card className="h-[calc(100vh-300px)]">
                <CardContent className="p-4 h-full flex flex-col">
                  <div className="flex items-center gap-2 mb-4">
                    <Input
                      value={editingNote.title}
                      onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                      className="text-lg font-semibold border-none focus-visible:ring-0 px-0"
                      placeholder="Note title..."
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => selectedNote && handleTogglePin(selectedNote)}
                    >
                      {selectedNote?.is_pinned ? (
                        <PinOff className="h-4 w-4" />
                      ) : (
                        <Pin className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteNote(editingNote.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="flex-1 resize-none border-none focus-visible:ring-0"
                    placeholder="Start writing..."
                  />
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-1">
                      {editingNote.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => setEditingNote({
                            ...editingNote,
                            tags: editingNote.tags.filter(t => t !== tag),
                          })}
                        >
                          {tag} ×
                        </Badge>
                      ))}
                      <Input
                        placeholder="Add tag..."
                        className="w-24 h-6 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const newTag = e.currentTarget.value.trim();
                            if (!editingNote.tags.includes(newTag)) {
                              setEditingNote({
                                ...editingNote,
                                tags: [...editingNote.tags, newTag],
                              });
                            }
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                    </div>
                    <Button onClick={handleSaveNote} disabled={updateNote.isPending}>
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-300px)] flex items-center justify-center">
                <CardContent className="text-center">
                  <StickyNote className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select or create a note</h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a note from the list or create a new one
                  </p>
                  <Button onClick={handleCreateNote}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Note
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotesPage;

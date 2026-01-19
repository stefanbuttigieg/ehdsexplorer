import { useState } from 'react';
import { Plus, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCreateFootnote, useDeleteFootnote, Footnote } from '@/hooks/useFootnotes';

interface FootnoteManagerProps {
  footnotes: Footnote[];
  articleId?: number | null;
  recitalId?: number | null;
}

/**
 * Reusable component for managing footnotes on articles or recitals.
 * Displays existing footnotes and provides add/delete functionality.
 */
export function FootnoteManager({
  footnotes,
  articleId = null,
  recitalId = null,
}: FootnoteManagerProps) {
  const { toast } = useToast();
  const createFootnote = useCreateFootnote();
  const deleteFootnote = useDeleteFootnote();

  const [marker, setMarker] = useState('');
  const [content, setContent] = useState('');

  const handleAdd = async () => {
    if (!marker || !content) return;

    try {
      await createFootnote.mutateAsync({
        marker,
        content,
        article_id: articleId,
        recital_id: recitalId,
      });
      setMarker('');
      setContent('');
      toast({ title: 'Footnote added' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add footnote',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this footnote?')) return;

    try {
      await deleteFootnote.mutateAsync(id);
      toast({ title: 'Footnote deleted' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete footnote',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 text-muted-foreground" />
        <Label className="text-base font-medium">
          Footnotes ({footnotes.length})
        </Label>
      </div>

      {footnotes.length > 0 && (
        <div className="space-y-2">
          {footnotes.map((fn) => (
            <div
              key={fn.id}
              className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm"
            >
              <span className="font-mono text-primary shrink-0">{fn.marker}</span>
              <p className="flex-1 text-muted-foreground">{fn.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(fn.id)}
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
            value={marker}
            onChange={(e) => setMarker(e.target.value)}
            className="w-32"
          />
          <Textarea
            placeholder="Footnote content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
            className="flex-1"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!marker || !content || createFootnote.isPending}
          className="w-fit"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Footnote
        </Button>
      </div>
    </div>
  );
}

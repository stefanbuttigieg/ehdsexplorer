import { useState } from 'react';
import { Trash2, Edit2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAnnotations, Annotation } from '@/hooks/useAnnotations';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface AnnotationPopoverProps {
  annotation: Annotation;
  position: { x: number; y: number };
  onClose: () => void;
}

export const AnnotationPopover = ({
  annotation,
  position,
  onClose,
}: AnnotationPopoverProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(annotation.comment || '');
  
  const { updateAnnotation, deleteAnnotation } = useAnnotations();

  const handleSave = async () => {
    try {
      await updateAnnotation.mutateAsync({
        id: annotation.id,
        comment: editedComment || undefined,
      });
      toast.success('Annotation updated');
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to update annotation');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAnnotation.mutateAsync(annotation.id);
      toast.success('Annotation deleted');
      onClose();
    } catch (error) {
      toast.error('Failed to delete annotation');
    }
  };

  return (
    <div
      className="fixed z-[110] bg-background border border-border rounded-lg shadow-lg p-3 w-72 animate-in fade-in zoom-in-95"
      style={{
        left: Math.min(position.x, window.innerWidth - 300),
        top: Math.min(position.y + 10, window.innerHeight - 250),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">
          {format(new Date(annotation.created_at), 'MMM d, yyyy')}
        </span>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleSave}
                disabled={updateAnnotation.isPending}
              >
                <Check className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive"
                onClick={handleDelete}
                disabled={deleteAnnotation.isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      
      <blockquote className="border-l-2 border-muted-foreground/30 pl-2 mb-2 text-sm italic text-muted-foreground line-clamp-3">
        "{annotation.selected_text}"
      </blockquote>
      
      {isEditing ? (
        <Textarea
          value={editedComment}
          onChange={(e) => setEditedComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] text-sm"
          autoFocus
        />
      ) : annotation.comment ? (
        <p className="text-sm">{annotation.comment}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">No comment</p>
      )}
    </div>
  );
};

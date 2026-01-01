import { useState } from 'react';
import { Highlighter, MessageSquare, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAnnotations, useAnnotationTags } from '@/hooks/useAnnotations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AnnotationToolbarProps {
  position: { x: number; y: number };
  selectedText: string;
  contentType: 'article' | 'recital' | 'implementing_act';
  contentId: string;
  startOffset: number;
  endOffset: number;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'yellow', class: 'bg-yellow-300', hex: '#fde047' },
  { name: 'green', class: 'bg-green-300', hex: '#86efac' },
  { name: 'blue', class: 'bg-blue-300', hex: '#93c5fd' },
  { name: 'pink', class: 'bg-pink-300', hex: '#f9a8d4' },
  { name: 'orange', class: 'bg-orange-300', hex: '#fdba74' },
];

export const AnnotationToolbar = ({
  position,
  selectedText,
  contentType,
  contentId,
  startOffset,
  endOffset,
  onClose,
}: AnnotationToolbarProps) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [selectedColor, setSelectedColor] = useState('yellow');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  
  const { createAnnotation, isLoggedIn } = useAnnotations();
  const { tags } = useAnnotationTags();

  const handleHighlight = async (color: string = selectedColor) => {
    try {
      await createAnnotation.mutateAsync({
        content_type: contentType,
        content_id: contentId,
        selected_text: selectedText,
        start_offset: startOffset,
        end_offset: endOffset,
        highlight_color: color,
        comment: comment || undefined,
        tag_ids: selectedTagIds,
      });
      
      toast.success('Text highlighted' + (!isLoggedIn ? ' (saved locally)' : ''));
      onClose();
    } catch (error) {
      toast.error('Failed to save highlight');
    }
  };

  const handleAddComment = () => {
    if (!showCommentInput) {
      setShowCommentInput(true);
    } else {
      handleHighlight();
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  return (
    <div
      data-annotation-toolbar
      className="fixed z-[110] bg-background border border-border rounded-lg shadow-lg p-2 animate-in fade-in zoom-in-95"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 200),
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 mb-2">
        {HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color.name}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-transform hover:scale-110',
              color.class,
              selectedColor === color.name ? 'border-foreground scale-110' : 'border-transparent'
            )}
            onClick={() => {
              setSelectedColor(color.name);
              if (!showCommentInput) {
                handleHighlight(color.name);
              }
            }}
            title={`Highlight ${color.name}`}
          />
        ))}
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleAddComment}
          title="Add comment"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
        {tags.length > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Add tags"
              >
                <Tag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1 rounded text-sm transition-colors',
                      selectedTagIds.includes(tag.id) 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-muted'
                    )}
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: tag.color }} 
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 ml-auto"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {showCommentInput && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[80px] text-sm"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCommentInput(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleHighlight()}
              disabled={createAnnotation.isPending}
            >
              Save
            </Button>
          </div>
        </div>
      )}
      
    </div>
  );
};

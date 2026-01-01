import { useState, useRef, useCallback, useEffect } from 'react';
import { useAnnotations, Annotation } from '@/hooks/useAnnotations';
import { AnnotationToolbar } from './AnnotationToolbar';
import { AnnotationPopover } from './AnnotationPopover';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AnnotatedContentProps {
  content: string;
  contentType: 'article' | 'recital' | 'implementing_act';
  contentId: string;
  className?: string;
}

const HIGHLIGHT_COLOR_MAP: Record<string, string> = {
  yellow: 'bg-yellow-200/70 dark:bg-yellow-300/40',
  green: 'bg-green-200/70 dark:bg-green-300/40',
  blue: 'bg-blue-200/70 dark:bg-blue-300/40',
  pink: 'bg-pink-200/70 dark:bg-pink-300/40',
  orange: 'bg-orange-200/70 dark:bg-orange-300/40',
};

export const AnnotatedContent = ({
  content,
  contentType,
  contentId,
  className,
}: AnnotatedContentProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionOffsets, setSelectionOffsets] = useState({ start: 0, end: 0 });
  const [activeAnnotation, setActiveAnnotation] = useState<Annotation | null>(null);
  const [annotationPopoverPosition, setAnnotationPopoverPosition] = useState<{ x: number; y: number } | null>(null);
  const justOpenedRef = useRef(false);
  
  const { annotations } = useAnnotations(contentType, contentId);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 4 || text.length > 500) {
      return;
    }

    // Check if selection is within our content
    const range = selection.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      return;
    }

    // Get text content and offsets
    const contentText = contentRef.current.textContent || '';
    const preSelectionRange = document.createRange();
    preSelectionRange.selectNodeContents(contentRef.current);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preSelectionRange.toString().length;
    const endOffset = startOffset + text.length;

    const rect = range.getBoundingClientRect();
    setToolbarPosition({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 8,
    });
    setSelectedText(text);
    setSelectionOffsets({ start: startOffset, end: endOffset });
    
    // Prevent the click handler from immediately closing the toolbar
    justOpenedRef.current = true;
    setTimeout(() => {
      justOpenedRef.current = false;
    }, 100);
  }, []);

  const closeToolbar = useCallback(() => {
    setToolbarPosition(null);
    setSelectedText('');
    window.getSelection()?.removeAllRanges();
  }, []);

  const handleAnnotationClick = (annotation: Annotation, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveAnnotation(annotation);
    setAnnotationPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Skip if we just opened the toolbar
      if (justOpenedRef.current) {
        return;
      }
      
      const target = e.target as HTMLElement;
      // Don't close if clicking inside toolbar or popover
      if (target.closest('[data-annotation-toolbar]') || target.closest('[data-annotation-popover]')) {
        return;
      }
      if (toolbarPosition) {
        closeToolbar();
      }
      if (activeAnnotation) {
        setActiveAnnotation(null);
        setAnnotationPopoverPosition(null);
      }
    };

    // Use click instead of mousedown to avoid closing during selection
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [toolbarPosition, activeAnnotation, closeToolbar]);

  // Render content with highlights
  const renderHighlightedContent = () => {
    if (!annotations.length) {
      return (
        <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    // For simplicity, we'll render the content normally and overlay highlights
    // A more sophisticated implementation would parse and interleave highlights
    return (
      <div className={cn('prose prose-sm dark:prose-invert max-w-none relative', className)}>
        <ReactMarkdown>{content}</ReactMarkdown>
        {/* Highlight indicators */}
        {annotations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border not-prose">
            <p className="text-xs text-muted-foreground mb-2">
              {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} on this content
            </p>
            <div className="flex flex-wrap gap-2">
              {annotations.map((annotation) => (
                <button
                  key={annotation.id}
                  onClick={(e) => handleAnnotationClick(annotation, e)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer',
                    HIGHLIGHT_COLOR_MAP[annotation.highlight_color] || HIGHLIGHT_COLOR_MAP.yellow,
                    'hover:ring-2 hover:ring-primary/50'
                  )}
                >
                  "{annotation.selected_text.slice(0, 30)}{annotation.selected_text.length > 30 ? '...' : ''}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div
        ref={contentRef}
        onMouseUp={handleTextSelection}
        className="select-text"
      >
        {renderHighlightedContent()}
      </div>

      {toolbarPosition && (
        <AnnotationToolbar
          position={toolbarPosition}
          selectedText={selectedText}
          contentType={contentType}
          contentId={contentId}
          startOffset={selectionOffsets.start}
          endOffset={selectionOffsets.end}
          onClose={closeToolbar}
        />
      )}

      {activeAnnotation && annotationPopoverPosition && (
        <AnnotationPopover
          annotation={activeAnnotation}
          position={annotationPopoverPosition}
          onClose={() => {
            setActiveAnnotation(null);
            setAnnotationPopoverPosition(null);
          }}
        />
      )}
    </>
  );
};

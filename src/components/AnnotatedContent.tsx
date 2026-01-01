import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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

// Component to render text with highlights
const HighlightedText = ({ 
  text, 
  annotations, 
  onAnnotationClick 
}: { 
  text: string; 
  annotations: Annotation[];
  onAnnotationClick: (annotation: Annotation, event: React.MouseEvent) => void;
}) => {
  if (!annotations.length) {
    return <>{text}</>;
  }

  // Find all annotations that match text in this segment
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  const textLower = text.toLowerCase();

  // Sort annotations and find matches by selected_text
  const matches: { start: number; end: number; annotation: Annotation }[] = [];
  
  for (const annotation of annotations) {
    const searchText = annotation.selected_text.toLowerCase();
    let searchStart = 0;
    
    while (searchStart < text.length) {
      const index = textLower.indexOf(searchText, searchStart);
      if (index === -1) break;
      
      matches.push({
        start: index,
        end: index + annotation.selected_text.length,
        annotation
      });
      searchStart = index + 1;
    }
  }

  // Sort by start position and remove overlaps
  matches.sort((a, b) => a.start - b.start);
  const nonOverlapping = matches.filter((match, i) => {
    if (i === 0) return true;
    return match.start >= matches[i - 1].end;
  });

  for (const match of nonOverlapping) {
    // Add text before the match
    if (match.start > lastIndex) {
      elements.push(text.slice(lastIndex, match.start));
    }
    
    // Add highlighted text
    elements.push(
      <mark
        key={`${match.annotation.id}-${match.start}`}
        className={cn(
          'cursor-pointer rounded px-0.5 transition-all hover:ring-2 hover:ring-primary/50',
          HIGHLIGHT_COLOR_MAP[match.annotation.highlight_color] || HIGHLIGHT_COLOR_MAP.yellow
        )}
        onClick={(e) => onAnnotationClick(match.annotation, e)}
        title={match.annotation.comment || 'Click to view annotation'}
      >
        {text.slice(match.start, match.end)}
      </mark>
    );
    
    lastIndex = match.end;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return <>{elements}</>;
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

  const handleAnnotationClick = useCallback((annotation: Annotation, event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveAnnotation(annotation);
    setAnnotationPopoverPosition({
      x: event.clientX,
      y: event.clientY,
    });
  }, []);

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

  // Custom components for ReactMarkdown that apply highlighting
  const markdownComponents = useMemo(() => ({
    p: ({ children, ...props }: any) => (
      <p {...props}>
        {typeof children === 'string' ? (
          <HighlightedText 
            text={children} 
            annotations={annotations} 
            onAnnotationClick={handleAnnotationClick} 
          />
        ) : (
          children
        )}
      </p>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props}>
        {typeof children === 'string' ? (
          <HighlightedText 
            text={children} 
            annotations={annotations} 
            onAnnotationClick={handleAnnotationClick} 
          />
        ) : (
          children
        )}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong {...props}>
        {typeof children === 'string' ? (
          <HighlightedText 
            text={children} 
            annotations={annotations} 
            onAnnotationClick={handleAnnotationClick} 
          />
        ) : (
          children
        )}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em {...props}>
        {typeof children === 'string' ? (
          <HighlightedText 
            text={children} 
            annotations={annotations} 
            onAnnotationClick={handleAnnotationClick} 
          />
        ) : (
          children
        )}
      </em>
    ),
  }), [annotations, handleAnnotationClick]);

  return (
    <>
      <div
        ref={contentRef}
        onMouseUp={handleTextSelection}
        className="select-text"
      >
        <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>
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

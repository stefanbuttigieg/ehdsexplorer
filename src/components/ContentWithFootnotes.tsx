import { useMemo } from "react";
import { Footnote } from "@/hooks/useFootnotes";

interface ContentWithFootnotesProps {
  content: string;
  footnotes: Footnote[];
  className?: string;
}

const ContentWithFootnotes = ({ content, footnotes, className = "" }: ContentWithFootnotesProps) => {
  const renderedContent = useMemo(() => {
    if (!footnotes.length) return content;

    // Sort markers by length (longest first) to avoid partial matches
    const sortedFootnotes = [...footnotes].sort((a, b) => b.marker.length - a.marker.length);
    
    // Escape special regex characters in markers
    const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Build regex pattern for all markers
    const markerPattern = sortedFootnotes.map(fn => escapeRegex(fn.marker)).join('|');
    if (!markerPattern) return content;
    
    const regex = new RegExp(`(${markerPattern})`, 'g');
    const parts = content.split(regex);
    
    return parts.map((part, index) => {
      const footnote = footnotes.find(fn => fn.marker === part);
      if (footnote) {
        return (
          <a
            key={index}
            href={`#footnote-${footnote.id}`}
            className="text-primary hover:underline cursor-pointer font-mono text-sm align-super"
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(`footnote-${footnote.id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('bg-primary/20');
                setTimeout(() => element.classList.remove('bg-primary/20'), 2000);
              }
            }}
            title={footnote.content.slice(0, 100) + (footnote.content.length > 100 ? '...' : '')}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  }, [content, footnotes]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {renderedContent}
    </div>
  );
};

export default ContentWithFootnotes;

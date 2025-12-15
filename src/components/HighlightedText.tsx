import { useMemo } from "react";

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
  maxLength?: number;
}

export const HighlightedText = ({
  text,
  query,
  className = "",
  highlightClassName = "bg-primary/20 text-primary font-medium",
  maxLength,
}: HighlightedTextProps) => {
  const highlighted = useMemo(() => {
    if (!query.trim() || !text) {
      const displayText = maxLength && text.length > maxLength 
        ? text.substring(0, maxLength) + "..." 
        : text;
      return <span className={className}>{displayText}</span>;
    }

    // Split query into words for multi-word highlighting
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    if (queryWords.length === 0) {
      const displayText = maxLength && text.length > maxLength 
        ? text.substring(0, maxLength) + "..." 
        : text;
      return <span className={className}>{displayText}</span>;
    }

    // Find all match positions
    const matches: { start: number; end: number }[] = [];
    const lowerText = text.toLowerCase();

    queryWords.forEach(word => {
      let pos = 0;
      while ((pos = lowerText.indexOf(word, pos)) !== -1) {
        matches.push({ start: pos, end: pos + word.length });
        pos += 1;
      }
    });

    if (matches.length === 0) {
      const displayText = maxLength && text.length > maxLength 
        ? text.substring(0, maxLength) + "..." 
        : text;
      return <span className={className}>{displayText}</span>;
    }

    // Sort and merge overlapping matches
    matches.sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];
    for (const match of matches) {
      if (merged.length === 0 || merged[merged.length - 1].end < match.start) {
        merged.push({ ...match });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, match.end);
      }
    }

    // If maxLength is set, find the best context window around the first match
    let displayText = text;
    let offset = 0;
    let prefix = "";
    let suffix = "";

    if (maxLength && text.length > maxLength && merged.length > 0) {
      const firstMatch = merged[0];
      const contextPadding = Math.floor((maxLength - (firstMatch.end - firstMatch.start)) / 2);
      let start = Math.max(0, firstMatch.start - contextPadding);
      let end = Math.min(text.length, start + maxLength);
      
      // Adjust start if we're near the end
      if (end === text.length) {
        start = Math.max(0, end - maxLength);
      }

      prefix = start > 0 ? "..." : "";
      suffix = end < text.length ? "..." : "";
      displayText = text.substring(start, end);
      offset = start;
    }

    // Build highlighted segments
    const segments: React.ReactNode[] = [];
    let lastEnd = 0;

    for (const match of merged) {
      const adjustedStart = match.start - offset;
      const adjustedEnd = match.end - offset;

      // Skip if match is outside our display window
      if (adjustedEnd < 0 || adjustedStart >= displayText.length) continue;

      const clampedStart = Math.max(0, adjustedStart);
      const clampedEnd = Math.min(displayText.length, adjustedEnd);

      if (clampedStart > lastEnd) {
        segments.push(
          <span key={`text-${lastEnd}`}>
            {displayText.substring(lastEnd, clampedStart)}
          </span>
        );
      }

      segments.push(
        <mark key={`match-${clampedStart}`} className={highlightClassName}>
          {displayText.substring(clampedStart, clampedEnd)}
        </mark>
      );

      lastEnd = clampedEnd;
    }

    if (lastEnd < displayText.length) {
      segments.push(
        <span key={`text-${lastEnd}`}>
          {displayText.substring(lastEnd)}
        </span>
      );
    }

    return (
      <span className={className}>
        {prefix}
        {segments}
        {suffix}
      </span>
    );
  }, [text, query, className, highlightClassName, maxLength]);

  return highlighted;
};

import { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff, FileText, List, BookOpen, Hash, StickyNote, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  ParsedContent,
  StructureAnalysis,
} from '@/hooks/useAdaptiveParser';

interface ExtractionPreviewViewerProps {
  sourceText: string;
  parsedContent: ParsedContent;
  analysis: StructureAnalysis;
}

interface ExtractionMatch {
  type: 'recital' | 'article' | 'annex' | 'footnote' | 'chapter' | 'definition';
  number: number | string;
  startIndex: number;
  endIndex: number;
  content: string;
}

// Color mapping for different content types
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  recital: { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-400', text: 'text-blue-700 dark:text-blue-300' },
  article: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-400', text: 'text-green-700 dark:text-green-300' },
  annex: { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  footnote: { bg: 'bg-amber-100 dark:bg-amber-900/30', border: 'border-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  chapter: { bg: 'bg-red-100 dark:bg-red-900/30', border: 'border-red-400', text: 'text-red-700 dark:text-red-300' },
  definition: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', border: 'border-cyan-400', text: 'text-cyan-700 dark:text-cyan-300' },
};

export function ExtractionPreviewViewer({
  sourceText,
  parsedContent,
  analysis,
}: ExtractionPreviewViewerProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: string; number: number | string } | null>(null);
  const [showHighlights, setShowHighlights] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recitals: true,
    articles: true,
    annexes: true,
    footnotes: true,
    definitions: true,
  });
  
  const sourceRef = useRef<HTMLDivElement>(null);

  // Find matches in source text
  const matches = useMemo(() => {
    const found: ExtractionMatch[] = [];
    
    // Find recitals
    parsedContent.recitals.forEach(r => {
      const pattern = new RegExp(`\\(${r.recitalNumber}\\)\\s+`, 'g');
      let match;
      while ((match = pattern.exec(sourceText)) !== null) {
        const contentPreview = r.content.slice(0, 50);
        const contentIndex = sourceText.indexOf(contentPreview, match.index);
        if (contentIndex !== -1 && contentIndex < match.index + 100) {
          found.push({
            type: 'recital',
            number: r.recitalNumber,
            startIndex: match.index,
            endIndex: match.index + r.content.length + 10,
            content: r.content.slice(0, 100),
          });
          break;
        }
      }
    });
    
    // Find articles
    const articlePatterns = [
      /Article\s+(\d+)/gi,
      /Artikel\s+(\d+)/gi,
      /Artículo\s+(\d+)/gi,
      /Articolo\s+(\d+)/gi,
      /Artigo\s+(\d+)/gi,
    ];
    
    parsedContent.articles.forEach(a => {
      for (const pattern of articlePatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(sourceText)) !== null) {
          if (parseInt(match[1]) === a.articleNumber) {
            found.push({
              type: 'article',
              number: a.articleNumber,
              startIndex: match.index,
              endIndex: match.index + Math.min(a.content.length, 500) + 20,
              content: a.title,
            });
            break;
          }
        }
      }
    });
    
    // Find annexes
    const annexPatterns = [
      /ANNEX\s+([IVXLCDM]+)/gi,
      /ANHANG\s+([IVXLCDM]+)/gi,
      /ANNEXE\s+([IVXLCDM]+)/gi,
    ];
    
    parsedContent.annexes.forEach(a => {
      for (const pattern of annexPatterns) {
        pattern.lastIndex = 0;
        let match;
        while ((match = pattern.exec(sourceText)) !== null) {
          if (match[1].toUpperCase() === a.romanNumeral) {
            found.push({
              type: 'annex',
              number: a.annexNumber,
              startIndex: match.index,
              endIndex: match.index + 200,
              content: a.title,
            });
            break;
          }
        }
      }
    });
    
    // Find footnotes
    parsedContent.footnotes.forEach(f => {
      const pattern = new RegExp(`\\(${f.marker.replace(/[*]/g, '\\*')}\\)\\s+`, 'g');
      let match;
      while ((match = pattern.exec(sourceText)) !== null) {
        // Check if this looks like a footnote (has OJ or legal reference)
        const context = sourceText.slice(match.index, match.index + 100);
        if (/OJ|ABl\.|Regulation|Directive/i.test(context)) {
          found.push({
            type: 'footnote',
            number: f.marker,
            startIndex: match.index,
            endIndex: match.index + f.content.length + 5,
            content: f.content.slice(0, 80),
          });
          break;
        }
      }
    });
    
    return found.sort((a, b) => a.startIndex - b.startIndex);
  }, [sourceText, parsedContent]);

  // Create highlighted source view
  const highlightedSource = useMemo(() => {
    if (!showHighlights || matches.length === 0) {
      return sourceText;
    }
    
    // Build segments
    const segments: Array<{ text: string; match?: ExtractionMatch }> = [];
    let lastEnd = 0;
    
    for (const match of matches) {
      if (match.startIndex > lastEnd) {
        segments.push({ text: sourceText.slice(lastEnd, match.startIndex) });
      }
      segments.push({ 
        text: sourceText.slice(match.startIndex, Math.min(match.startIndex + 100, sourceText.length)),
        match 
      });
      lastEnd = Math.min(match.startIndex + 100, sourceText.length);
    }
    
    if (lastEnd < sourceText.length) {
      segments.push({ text: sourceText.slice(lastEnd) });
    }
    
    return segments;
  }, [sourceText, matches, showHighlights]);

  // Scroll to item when selected
  useEffect(() => {
    if (selectedItem && sourceRef.current) {
      const match = matches.find(
        m => m.type === selectedItem.type && m.number === selectedItem.number
      );
      if (match) {
        // Calculate approximate line position
        const textBefore = sourceText.slice(0, match.startIndex);
        const lineNumber = (textBefore.match(/\n/g) || []).length;
        const scrollTarget = (lineNumber / (sourceText.match(/\n/g) || []).length) * sourceRef.current.scrollHeight;
        sourceRef.current.scrollTo({ top: scrollTarget - 100, behavior: 'smooth' });
      }
    }
  }, [selectedItem, matches, sourceText]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleItemClick = (type: string, number: number | string) => {
    setSelectedItem({ type, number });
    setSelectedType(type);
  };

  // Stats
  const stats = {
    recitals: parsedContent.recitals.length,
    articles: parsedContent.articles.length,
    annexes: parsedContent.annexes.length,
    footnotes: parsedContent.footnotes.length,
    definitions: parsedContent.definitions.length,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-300px)] min-h-[600px] border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-4">
          <h3 className="font-semibold">Extraction Preview</h3>
          <div className="flex gap-2">
            <Badge variant="outline" className={TYPE_COLORS.recital.text}>
              {stats.recitals} Recitals
            </Badge>
            <Badge variant="outline" className={TYPE_COLORS.article.text}>
              {stats.articles} Articles
            </Badge>
            <Badge variant="outline" className={TYPE_COLORS.annex.text}>
              {stats.annexes} Annexes
            </Badge>
            <Badge variant="outline" className={TYPE_COLORS.footnote.text}>
              {stats.footnotes} Footnotes
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowHighlights(!showHighlights)}
        >
          {showHighlights ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
          {showHighlights ? 'Hide' : 'Show'} Highlights
        </Button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Source with highlights */}
        <div className="flex-1 flex flex-col border-r">
          <div className="p-2 border-b bg-muted/30 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Source Content</span>
            <Badge variant="secondary" className="ml-auto">
              {analysis.detectedLanguage.toUpperCase()}
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div 
              ref={sourceRef}
              className="p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap"
            >
              {Array.isArray(highlightedSource) ? (
                highlightedSource.map((segment, i) => {
                  if (segment.match) {
                    const colors = TYPE_COLORS[segment.match.type];
                    const isSelected = 
                      selectedItem?.type === segment.match.type && 
                      selectedItem?.number === segment.match.number;
                    return (
                      <span
                        key={i}
                        className={cn(
                          'cursor-pointer rounded px-0.5 transition-all',
                          colors.bg,
                          isSelected && 'ring-2 ring-primary'
                        )}
                        onClick={() => handleItemClick(segment.match!.type, segment.match!.number)}
                        title={`${segment.match.type} ${segment.match.number}`}
                      >
                        {segment.text}
                      </span>
                    );
                  }
                  return <span key={i}>{segment.text}</span>;
                })
              ) : (
                sourceText
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Extracted content */}
        <div className="w-96 flex flex-col">
          <Tabs defaultValue="all" className="flex-1 flex flex-col">
            <div className="p-2 border-b">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="articles" className="text-xs">Articles</TabsTrigger>
                <TabsTrigger value="annexes" className="text-xs">Annexes</TabsTrigger>
                <TabsTrigger value="footnotes" className="text-xs">Notes</TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="flex-1">
              <TabsContent value="all" className="m-0 p-2 space-y-2">
                {/* Recitals */}
                <Collapsible open={expandedSections.recitals} onOpenChange={() => toggleSection('recitals')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                    {expandedSections.recitals ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <BookOpen className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Recitals</span>
                    <Badge variant="secondary" className="ml-auto">{stats.recitals}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1">
                    {parsedContent.recitals.slice(0, 10).map(r => (
                      <ExtractedItem
                        key={r.recitalNumber}
                        type="recital"
                        number={r.recitalNumber}
                        preview={r.content.slice(0, 80)}
                        isSelected={selectedItem?.type === 'recital' && selectedItem?.number === r.recitalNumber}
                        onClick={() => handleItemClick('recital', r.recitalNumber)}
                      />
                    ))}
                    {stats.recitals > 10 && (
                      <p className="text-xs text-muted-foreground pl-2">
                        +{stats.recitals - 10} more recitals
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Articles */}
                <Collapsible open={expandedSections.articles} onOpenChange={() => toggleSection('articles')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                    {expandedSections.articles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <List className="h-4 w-4 text-green-500" />
                    <span className="font-medium">Articles</span>
                    <Badge variant="secondary" className="ml-auto">{stats.articles}</Badge>
                    {stats.articles === 0 && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1">
                    {parsedContent.articles.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-2">
                        No articles detected. Check source format.
                      </p>
                    ) : (
                      <>
                        {parsedContent.articles.slice(0, 10).map(a => (
                          <ExtractedItem
                            key={a.articleNumber}
                            type="article"
                            number={a.articleNumber}
                            preview={a.title}
                            isSelected={selectedItem?.type === 'article' && selectedItem?.number === a.articleNumber}
                            onClick={() => handleItemClick('article', a.articleNumber)}
                          />
                        ))}
                        {stats.articles > 10 && (
                          <p className="text-xs text-muted-foreground pl-2">
                            +{stats.articles - 10} more articles
                          </p>
                        )}
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Annexes */}
                <Collapsible open={expandedSections.annexes} onOpenChange={() => toggleSection('annexes')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                    {expandedSections.annexes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <Hash className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">Annexes</span>
                    <Badge variant="secondary" className="ml-auto">{stats.annexes}</Badge>
                    {stats.annexes === 0 && <AlertCircle className="h-4 w-4 text-destructive" />}
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1">
                    {parsedContent.annexes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-2">
                        No annexes detected. Check source format.
                      </p>
                    ) : (
                      parsedContent.annexes.map(a => (
                        <ExtractedItem
                          key={a.annexNumber}
                          type="annex"
                          number={a.annexNumber}
                          preview={`${a.romanNumeral}: ${a.title}`}
                          isSelected={selectedItem?.type === 'annex' && selectedItem?.number === a.annexNumber}
                          onClick={() => handleItemClick('annex', a.annexNumber)}
                        />
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Footnotes */}
                <Collapsible open={expandedSections.footnotes} onOpenChange={() => toggleSection('footnotes')}>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted rounded">
                    {expandedSections.footnotes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <StickyNote className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Footnotes</span>
                    <Badge variant="secondary" className="ml-auto">{stats.footnotes}</Badge>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 space-y-1">
                    {parsedContent.footnotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic p-2">
                        No footnotes detected.
                      </p>
                    ) : (
                      parsedContent.footnotes.map(f => (
                        <ExtractedItem
                          key={f.marker}
                          type="footnote"
                          number={f.marker}
                          preview={f.content.slice(0, 60)}
                          isSelected={selectedItem?.type === 'footnote' && selectedItem?.number === f.marker}
                          onClick={() => handleItemClick('footnote', f.marker)}
                        />
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </TabsContent>

              <TabsContent value="articles" className="m-0 p-2">
                {parsedContent.articles.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="font-medium">No articles detected</p>
                    <p className="text-xs mt-1">The parser couldn't find article markers in the source text.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {parsedContent.articles.map(a => (
                      <ExtractedItem
                        key={a.articleNumber}
                        type="article"
                        number={a.articleNumber}
                        preview={a.title}
                        isSelected={selectedItem?.type === 'article' && selectedItem?.number === a.articleNumber}
                        onClick={() => handleItemClick('article', a.articleNumber)}
                        showContent={a.content.slice(0, 200)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="annexes" className="m-0 p-2">
                {parsedContent.annexes.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="font-medium">No annexes detected</p>
                    <p className="text-xs mt-1">The parser couldn't find annex markers (ANNEX I, II, etc.).</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {parsedContent.annexes.map(a => (
                      <div
                        key={a.annexNumber}
                        className={cn(
                          'p-3 border rounded-lg cursor-pointer transition-colors',
                          TYPE_COLORS.annex.bg,
                          selectedItem?.type === 'annex' && selectedItem?.number === a.annexNumber && 'ring-2 ring-primary'
                        )}
                        onClick={() => handleItemClick('annex', a.annexNumber)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{a.romanNumeral}</Badge>
                          <span className="font-medium text-sm">{a.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {a.content.slice(0, 150)}...
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="footnotes" className="m-0 p-2">
                {parsedContent.footnotes.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="font-medium">No footnotes detected</p>
                    <p className="text-xs mt-1">Footnotes typically contain legal references (OJ L..., Directive...).</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {parsedContent.footnotes.map(f => (
                      <div
                        key={f.marker}
                        className={cn(
                          'p-2 border rounded text-xs',
                          TYPE_COLORS.footnote.bg
                        )}
                      >
                        <span className="font-mono font-bold">({f.marker})</span>{' '}
                        <span className="text-muted-foreground">{f.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      {/* Footer with analysis info */}
      <div className="p-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center gap-4">
        <span>Format: {analysis.tableFormat}</span>
        <span>Footnotes: {analysis.footnoteFormat}</span>
        <span>Adoption line: {analysis.adoptionLineIndex}</span>
        <span>First article: {analysis.firstArticleIndex}</span>
        <span>First annex: {analysis.firstAnnexIndex}</span>
      </div>
    </div>
  );
}

// Individual extracted item component
interface ExtractedItemProps {
  type: string;
  number: number | string;
  preview: string;
  isSelected?: boolean;
  onClick?: () => void;
  showContent?: string;
}

const ExtractedItem = ({ type, number, preview, isSelected, onClick, showContent }: ExtractedItemProps) => {
  const colors = TYPE_COLORS[type] || TYPE_COLORS.article;
  
  return (
    <div
      className={cn(
        'p-2 rounded border cursor-pointer transition-all text-xs',
        colors.bg,
        colors.border,
        isSelected && 'ring-2 ring-primary'
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn('text-[10px]', colors.text)}>
          {number}
        </Badge>
        <span className="truncate flex-1">{preview}</span>
      </div>
      {showContent && (
        <p className="mt-1 text-muted-foreground line-clamp-3 pl-8">
          {showContent}...
        </p>
      )}
    </div>
  );
};

export default ExtractionPreviewViewer;

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Target, Save, RefreshCw, Trash2, BookOpen, List, Hash, StickyNote, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectionType = 'recital-start' | 'article-start' | 'annex-start' | 'footnote-start' | 'section-end';

export interface SelectionMark {
  type: SelectionType;
  startIndex: number;
  endIndex: number;
  selectedText: string;
}

interface PatternSelectionToolbarProps {
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
  currentSelectionType: SelectionType | null;
  onSelectType: (type: SelectionType | null) => void;
  marks: SelectionMark[];
  onRemoveMark: (index: number) => void;
  onClearMarks: () => void;
  onSavePatterns: () => void;
  onReparse: () => void;
  isSaving: boolean;
  isReparsing: boolean;
}

const SELECTION_TYPES: Array<{ type: SelectionType; label: string; icon: React.ReactNode; color: string }> = [
  { type: 'recital-start', label: 'Recitals Start', icon: <BookOpen className="h-3 w-3" />, color: 'bg-blue-500' },
  { type: 'article-start', label: 'Articles Start', icon: <List className="h-3 w-3" />, color: 'bg-green-500' },
  { type: 'annex-start', label: 'Annexes Start', icon: <Hash className="h-3 w-3" />, color: 'bg-purple-500' },
  { type: 'footnote-start', label: 'Footnotes Start', icon: <StickyNote className="h-3 w-3" />, color: 'bg-amber-500' },
  { type: 'section-end', label: 'Section End', icon: <X className="h-3 w-3" />, color: 'bg-red-500' },
];

export function PatternSelectionToolbar({
  isSelectionMode,
  onToggleSelectionMode,
  currentSelectionType,
  onSelectType,
  marks,
  onRemoveMark,
  onClearMarks,
  onSavePatterns,
  onReparse,
  isSaving,
  isReparsing,
}: PatternSelectionToolbarProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="py-2 px-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Pattern Selection
          <Badge variant={isSelectionMode ? 'default' : 'outline'} className="ml-auto">
            {isSelectionMode ? 'Active' : 'Inactive'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-3">
        {/* Toggle mode */}
        <Button
          variant={isSelectionMode ? 'destructive' : 'default'}
          size="sm"
          className="w-full"
          onClick={onToggleSelectionMode}
        >
          <Target className="h-4 w-4 mr-2" />
          {isSelectionMode ? 'Exit Selection Mode' : 'Enter Selection Mode'}
        </Button>

        {isSelectionMode && (
          <>
            {/* Selection type buttons */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Select text to mark as:</p>
              <div className="flex flex-wrap gap-1">
                {SELECTION_TYPES.map(({ type, label, icon, color }) => (
                  <Button
                    key={type}
                    variant={currentSelectionType === type ? 'default' : 'outline'}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => onSelectType(currentSelectionType === type ? null : type)}
                  >
                    <span className={cn('w-2 h-2 rounded-full mr-1', color)} />
                    {icon}
                    <span className="ml-1">{label.replace(' Start', '').replace(' End', '')}</span>
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Current marks */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Marked boundaries ({marks.length})</p>
                {marks.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onClearMarks}>
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
              {marks.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  Select text in the source to mark section boundaries
                </p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {marks.map((mark, idx) => {
                    const typeInfo = SELECTION_TYPES.find(t => t.type === mark.type);
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs p-1 bg-muted rounded"
                      >
                        <span className={cn('w-2 h-2 rounded-full', typeInfo?.color)} />
                        <span className="font-medium">{typeInfo?.label}:</span>
                        <span className="truncate flex-1 text-muted-foreground">
                          "{mark.selectedText.slice(0, 30)}..."
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => onRemoveMark(idx)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onReparse}
                disabled={marks.length === 0 || isReparsing}
              >
                <RefreshCw className={cn('h-4 w-4 mr-1', isReparsing && 'animate-spin')} />
                Re-parse
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={onSavePatterns}
                disabled={marks.length === 0 || isSaving}
              >
                <Save className={cn('h-4 w-4 mr-1', isSaving && 'animate-pulse')} />
                Save & Re-parse
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Color for selection highlighting in source
export function getSelectionColor(type: SelectionType): string {
  switch (type) {
    case 'recital-start': return 'bg-blue-200 dark:bg-blue-800/50';
    case 'article-start': return 'bg-green-200 dark:bg-green-800/50';
    case 'annex-start': return 'bg-purple-200 dark:bg-purple-800/50';
    case 'footnote-start': return 'bg-amber-200 dark:bg-amber-800/50';
    case 'section-end': return 'bg-red-200 dark:bg-red-800/50';
    default: return 'bg-gray-200 dark:bg-gray-800/50';
  }
}

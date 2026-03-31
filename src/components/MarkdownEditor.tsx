import { useState, useRef, useCallback } from 'react';
import { Eye, Edit2, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Link, Quote, Table2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

// Collapse blank lines between numbered list items so markdown treats them as one continuous list
const fixNumberedLists = (text: string): string => {
  const normalized = text.replace(/\r\n/g, '\n');
  return normalized.replace(/(^\d+\.\s+.*)\n\s*\n(?=\d+\.\s+)/gm, '$1\n');
};

/** Convert tab-separated or CSV text into a Markdown table */
const tsvToMarkdownTable = (text: string): string => {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return text;

  // Detect delimiter: tab or comma
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));

  if (rows.length === 0 || rows[0].length === 0) return text;

  const header = rows[0];
  const divider = header.map(() => '---');
  const dataRows = rows.slice(1);

  let md = `| ${header.join(' | ')} |\n`;
  md += `| ${divider.join(' | ')} |\n`;
  dataRows.forEach(row => {
    // Pad row to match header length
    while (row.length < header.length) row.push('');
    md += `| ${row.join(' | ')} |\n`;
  });

  return md;
};

/** Detect if text looks like tabular data */
const isTabularText = (text: string): boolean => {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return false;
  const tabCount = (lines[0].match(/\t/g) || []).length;
  if (tabCount >= 1) return true;
  // CSV: consistent comma count across lines
  const commaCount = (lines[0].match(/,/g) || []).length;
  if (commaCount >= 2 && lines.slice(1).every(l => (l.match(/,/g) || []).length === commaCount)) return true;
  return false;
};

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  shortcut?: string;
}

const MarkdownEditor = ({ value, onChange, rows = 16, placeholder }: MarkdownEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(
        selectedText ? newCursorPos + after.length : start + before.length,
        selectedText ? newCursorPos + after.length : start + before.length + (placeholder ? placeholder.length : 0)
      );
    }, 0);
  }, [value, onChange]);

  const insertLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
    
    const currentLine = value.substring(lineStart, actualLineEnd);
    const newLine = prefix + currentLine;
    
    const newValue = value.substring(0, lineStart) + newLine + value.substring(actualLineEnd);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [value, onChange]);

  const insertTable = useCallback(() => {
    const template = '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n';
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + template);
      return;
    }
    const pos = textarea.selectionStart;
    const newValue = value.substring(0, pos) + template + value.substring(pos);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(pos + template.length, pos + template.length);
    }, 0);
  }, [value, onChange]);

  const toolbarButtons: (ToolbarButton | 'separator')[] = [
    {
      icon: <Bold className="h-4 w-4" />,
      label: 'Bold',
      shortcut: 'Ctrl+B',
      action: () => insertText('**', '**', 'bold text'),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      label: 'Italic',
      shortcut: 'Ctrl+I',
      action: () => insertText('*', '*', 'italic text'),
    },
    'separator',
    {
      icon: <Heading1 className="h-4 w-4" />,
      label: 'Heading 1',
      action: () => insertLinePrefix('# '),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      label: 'Heading 2',
      action: () => insertLinePrefix('## '),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      label: 'Heading 3',
      action: () => insertLinePrefix('### '),
    },
    'separator',
    {
      icon: <List className="h-4 w-4" />,
      label: 'Bullet List',
      action: () => insertLinePrefix('- '),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      label: 'Numbered List',
      action: () => insertLinePrefix('1. '),
    },
    'separator',
    {
      icon: <Quote className="h-4 w-4" />,
      label: 'Quote',
      action: () => insertLinePrefix('> '),
    },
    {
      icon: <Link className="h-4 w-4" />,
      label: 'Link',
      action: () => insertText('[', '](url)', 'link text'),
    },
    {
      icon: <Table2 className="h-4 w-4" />,
      label: 'Insert Table',
      action: insertTable,
    },
  ];

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        insertText('**', '**', 'bold text');
      } else if (e.key === 'i') {
        e.preventDefault();
        insertText('*', '*', 'italic text');
      }
    }
  }, [insertText]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    // Detect tabular data (from spreadsheet or HTML table)
    if (html.includes('<table') || html.includes('<tr') || isTabularText(text)) {
      e.preventDefault();
      const mdTable = tsvToMarkdownTable(text);
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, pos) + '\n' + mdTable + value.substring(end);
        onChange(newValue);
      } else {
        onChange(value + '\n' + mdTable);
      }
    }
  }, [value, onChange]);

  return (
    <div className="border rounded-md overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/50 border-b px-2 flex items-center justify-between">
          <TabsList className="h-9 bg-transparent">
            <TabsTrigger value="write" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Edit2 className="h-3.5 w-3.5" />
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>
          {activeTab === 'write' && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              Paste tables from Excel/Sheets — auto-converts to Markdown
            </span>
          )}
        </div>
        
        {activeTab === 'write' && (
          <div className="bg-muted/30 border-b px-2 py-1 flex items-center gap-0.5 flex-wrap">
            {toolbarButtons.map((item, index) => {
              if (item === 'separator') {
                return <Separator key={index} orientation="vertical" className="h-5 mx-1" />;
              }
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={item.action}
                    >
                      {item.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {item.label}
                    {item.shortcut && <span className="ml-2 text-muted-foreground">{item.shortcut}</span>}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
        
        <TabsContent value="write" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={rows}
            placeholder={placeholder}
            className="border-0 rounded-none focus-visible:ring-0 font-mono text-sm resize-none"
          />
        </TabsContent>
        
        <TabsContent value="preview" className="m-0">
          <div 
            className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto"
            style={{ minHeight: `${rows * 1.5}rem` }}
          >
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkBreaks, remarkGfm]}>{fixNumberedLists(value)}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarkdownEditor;

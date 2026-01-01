import { useState } from 'react';
import { Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

const MarkdownEditor = ({ value, onChange, rows = 16, placeholder }: MarkdownEditorProps) => {
  const [activeTab, setActiveTab] = useState<string>('write');

  return (
    <div className="border rounded-md overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-muted/50 border-b px-2">
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
        </div>
        
        <TabsContent value="write" className="m-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
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
              <ReactMarkdown remarkPlugins={[remarkBreaks]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-muted-foreground italic">Nothing to preview</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="bg-muted/30 border-t px-3 py-1.5 text-xs text-muted-foreground">
        Supports Markdown: **bold**, *italic*, # headers, - lists, [links](url)
      </div>
    </div>
  );
};

export default MarkdownEditor;

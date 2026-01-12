import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Search, Edit2, Plus, Eye, EyeOff, Trash2, Globe } from 'lucide-react';
import { toast } from 'sonner';

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;
type ContentType = 'article' | 'recital' | 'definition' | 'annex' | 'chapter' | 'section' | 'implementing_act' | 'implementing_act_article' | 'implementing_act_recital' | 'news';

interface TranslationEditorProps {
  contentType: ContentType;
  languageCode: string;
}

interface SourceItem {
  id: string | number;
  title?: string;
  content?: string;
  term?: string;
  definition?: string;
  description?: string;
  summary?: string;
  number?: number;
}

interface Translation {
  id: string;
  is_published: boolean;
  [key: string]: any;
}

const translationConfigs: Record<ContentType, {
  table: TableName;
  idColumn: string;
  sourceTable: TableName;
  displayFields: { source: string; translated: string }[];
  numberField?: string;
}> = {
  article: {
    table: 'article_translations',
    idColumn: 'article_id',
    sourceTable: 'articles',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'content', translated: 'content' },
    ],
    numberField: 'article_number',
  },
  recital: {
    table: 'recital_translations',
    idColumn: 'recital_id',
    sourceTable: 'recitals',
    displayFields: [
      { source: 'content', translated: 'content' },
    ],
    numberField: 'recital_number',
  },
  definition: {
    table: 'definition_translations',
    idColumn: 'definition_id',
    sourceTable: 'definitions',
    displayFields: [
      { source: 'term', translated: 'term' },
      { source: 'definition', translated: 'definition' },
    ],
  },
  annex: {
    table: 'annex_translations',
    idColumn: 'annex_id',
    sourceTable: 'annexes',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'content', translated: 'content' },
    ],
  },
  chapter: {
    table: 'chapter_translations',
    idColumn: 'chapter_id',
    sourceTable: 'chapters',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'description', translated: 'description' },
    ],
    numberField: 'chapter_number',
  },
  section: {
    table: 'section_translations',
    idColumn: 'section_id',
    sourceTable: 'sections',
    displayFields: [
      { source: 'title', translated: 'title' },
    ],
    numberField: 'section_number',
  },
  implementing_act: {
    table: 'implementing_act_translations',
    idColumn: 'implementing_act_id',
    sourceTable: 'implementing_acts',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'description', translated: 'description' },
    ],
  },
  implementing_act_article: {
    table: 'implementing_act_article_translations',
    idColumn: 'article_id',
    sourceTable: 'implementing_act_articles',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'content', translated: 'content' },
    ],
    numberField: 'article_number',
  },
  implementing_act_recital: {
    table: 'implementing_act_recital_translations',
    idColumn: 'recital_id',
    sourceTable: 'implementing_act_recitals',
    displayFields: [
      { source: 'content', translated: 'content' },
    ],
    numberField: 'recital_number',
  },
  news: {
    table: 'news_summary_translations',
    idColumn: 'news_id',
    sourceTable: 'news_summaries',
    displayFields: [
      { source: 'title', translated: 'title' },
      { source: 'summary', translated: 'summary' },
    ],
  },
};

const TranslationEditor = ({ contentType, languageCode }: TranslationEditorProps) => {
  const config = translationConfigs[contentType];
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<SourceItem | null>(null);
  const [existingTranslation, setExistingTranslation] = useState<Translation | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isPublished, setIsPublished] = useState(false);

  // Fetch source items - using rpc-style query to avoid deep type inference
  const { data: sourceItems, isLoading: sourceLoading } = useQuery({
    queryKey: [config.sourceTable],
    queryFn: async (): Promise<SourceItem[]> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${config.sourceTable}?order=${config.numberField || 'id'}.asc`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Fetch existing translations for the language
  const { data: translations, isLoading: transLoading } = useQuery({
    queryKey: [config.table, languageCode],
    queryFn: async (): Promise<Translation[]> => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${config.table}?language_code=eq.${languageCode}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });

  // Create translation map for quick lookup
  const translationMap = new Map(
    translations?.map(t => [t[config.idColumn], t]) || []
  );

  // Filter items based on search
  const filteredItems = sourceItems?.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const title = item.title?.toLowerCase() || '';
    const content = item.content?.toLowerCase() || '';
    const term = item.term?.toLowerCase() || '';
    const number = item.number?.toString() || config.numberField ? (item as any)[config.numberField]?.toString() || '' : '';
    
    return title.includes(searchLower) || 
           content.includes(searchLower) || 
           term.includes(searchLower) ||
           number.includes(searchLower);
  }) || [];

  // Save translation mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { isNew: boolean; translationId?: string }) => {
      if (!editingItem) throw new Error('No item selected');

      const payload = {
        [config.idColumn]: editingItem.id,
        language_code: languageCode,
        is_published: isPublished,
        ...formData,
      };

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const url = data.isNew 
        ? `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${config.table}`
        : `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${config.table}?id=eq.${data.translationId}`;
      
      const response = await fetch(url, {
        method: data.isNew ? 'POST' : 'PATCH',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.table, languageCode] });
      queryClient.invalidateQueries({ queryKey: ['translation-stats', languageCode] });
      toast.success('Translation saved successfully');
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error('Failed to save translation: ' + error.message);
    },
  });

  // Delete translation mutation
  const deleteMutation = useMutation({
    mutationFn: async (translationId: string) => {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${config.table}?id=eq.${translationId}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.table, languageCode] });
      queryClient.invalidateQueries({ queryKey: ['translation-stats', languageCode] });
      toast.success('Translation deleted');
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete: ' + error.message);
    },
  });

  // Open edit dialog
  const handleEdit = (item: SourceItem) => {
    const existing = translationMap.get(item.id);
    setEditingItem(item);
    setExistingTranslation(existing || null);
    
    // Initialize form with existing translation or empty
    const initialData: Record<string, string> = {};
    config.displayFields.forEach(field => {
      initialData[field.translated] = existing?.[field.translated] || '';
    });
    setFormData(initialData);
    setIsPublished(existing?.is_published || false);
  };

  const handleSave = () => {
    const isNew = !existingTranslation;
    saveMutation.mutate({ isNew, translationId: existingTranslation?.id });
  };

  const handleDelete = () => {
    if (!existingTranslation) return;
    if (confirm('Are you sure you want to delete this translation?')) {
      deleteMutation.mutate(existingTranslation.id);
    }
  };

  const getItemLabel = (item: SourceItem): string => {
    if (config.numberField && (item as any)[config.numberField]) {
      const num = (item as any)[config.numberField];
      if (contentType === 'article') return `Article ${num}`;
      if (contentType === 'recital') return `Recital ${num}`;
      if (contentType === 'chapter') return `Chapter ${num}`;
      if (contentType === 'section') return `Section ${num}`;
      if (contentType === 'implementing_act_article') return `IA Article ${num}`;
      if (contentType === 'implementing_act_recital') return `IA Recital ${num}`;
    }
    return item.title || item.term || item.id.toString();
  };

  const isLoading = sourceLoading || transLoading;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Items List */}
      <ScrollArea className="h-[500px] border rounded-lg">
        <div className="p-2 space-y-1">
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-48 flex-1" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No items found
            </div>
          ) : (
            filteredItems.map((item) => {
              const hasTranslation = translationMap.has(item.id);
              const translation = translationMap.get(item.id);
              const isPublishedTrans = translation?.is_published;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Badge variant={hasTranslation ? 'default' : 'outline'} className="shrink-0">
                    {getItemLabel(item)}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {item.title || item.term || item.content?.substring(0, 80) || item.summary?.substring(0, 80)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasTranslation && (
                      <Badge 
                        variant={isPublishedTrans ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {isPublishedTrans ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                        {isPublishedTrans ? 'Published' : 'Draft'}
                      </Badge>
                    )}
                    <Button
                      variant={hasTranslation ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      {hasTranslation ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>{filteredItems.length} items</span>
        <span>
          {translations?.length || 0} translated • {translations?.filter(t => t.is_published).length || 0} published
        </span>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {existingTranslation ? 'Edit' : 'Add'} Translation
            </DialogTitle>
            <DialogDescription>
              {editingItem && getItemLabel(editingItem)} — {languageCode.toUpperCase()}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {config.displayFields.map((field) => {
              const sourceValue = editingItem?.[field.source as keyof SourceItem] || '';
              const isLongText = typeof sourceValue === 'string' && sourceValue.length > 200;

              return (
                <div key={field.translated} className="space-y-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Source (English) */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                        English ({field.source})
                      </Label>
                      {isLongText ? (
                        <div className="p-3 bg-muted rounded-md text-sm max-h-48 overflow-y-auto whitespace-pre-wrap">
                          {sourceValue as string}
                        </div>
                      ) : (
                        <div className="p-3 bg-muted rounded-md text-sm">
                          {sourceValue as string || <span className="text-muted-foreground italic">No content</span>}
                        </div>
                      )}
                    </div>

                    {/* Translation */}
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider">
                        Translation ({field.translated})
                      </Label>
                      {isLongText ? (
                        <Textarea
                          value={formData[field.translated] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.translated]: e.target.value,
                          }))}
                          rows={8}
                          placeholder={`Enter ${languageCode.toUpperCase()} translation...`}
                        />
                      ) : (
                        <Input
                          value={formData[field.translated] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [field.translated]: e.target.value,
                          }))}
                          placeholder={`Enter ${languageCode.toUpperCase()} translation...`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Publish toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="publish-toggle" className="font-medium">Publish Translation</Label>
                <p className="text-sm text-muted-foreground">
                  Published translations are visible to users
                </p>
              </div>
              <Switch
                id="publish-toggle"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {existingTranslation && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Translation'}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranslationEditor;

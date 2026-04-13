import { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getSourceLabel, type DefinitionSource } from '@/hooks/useDefinitions';
import {
  useDefinitionSources,
  useAddDefinitionSource,
  useUpdateDefinitionSource,
  useDeleteDefinitionSource,
  type DefinitionSourceRecord,
} from '@/hooks/useDefinitionSources';

const ALL_SOURCES: DefinitionSource[] = ['ehds_regulation', 'eu_ehr_glossary', 'xt_ehr', 'implementing_act'];

interface DefinitionSourceEditorProps {
  definitionId: number;
  definitionTerm: string;
}

export const DefinitionSourceEditor = ({ definitionId, definitionTerm }: DefinitionSourceEditorProps) => {
  const { toast } = useToast();
  const { data: sources = [], isLoading } = useDefinitionSources(definitionId);
  const addSource = useAddDefinitionSource();
  const updateSource = useUpdateDefinitionSource();
  const deleteSource = useDeleteDefinitionSource();

  const [editingSource, setEditingSource] = useState<DefinitionSourceRecord | null>(null);
  const [editedText, setEditedText] = useState('');
  const [editedArticle, setEditedArticle] = useState('');
  const [editedImplementingActId, setEditedImplementingActId] = useState('');
  
  const [addingSource, setAddingSource] = useState<DefinitionSource | null>(null);
  const [newSourceText, setNewSourceText] = useState('');
  const [newSourceArticle, setNewSourceArticle] = useState('');
  const [newImplementingActId, setNewImplementingActId] = useState('');

  const { data: implementingActs = [] } = useQuery({
    queryKey: ['implementing-acts-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('implementing_acts')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  const existingSources = sources.map(s => s.source);
  const availableSources = ALL_SOURCES.filter(s => !existingSources.includes(s));

  const handleStartEdit = (source: DefinitionSourceRecord) => {
    setEditingSource(source);
    setEditedText(source.source_text);
    setEditedArticle(source.source_article?.toString() || '');
    setEditedImplementingActId(source.implementing_act_id || '');
  };

  const handleSaveEdit = async () => {
    if (!editingSource) return;
    
    try {
      await updateSource.mutateAsync({
        id: editingSource.id,
        source_text: editedText,
        source_article: editedArticle ? parseInt(editedArticle) : null,
        implementing_act_id: editingSource.source === 'implementing_act' ? (editedImplementingActId || null) : null,
      });
      toast({ title: 'Source updated successfully' });
      setEditingSource(null);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddSource = async () => {
    if (!addingSource || !newSourceText.trim()) return;
    
    try {
      await addSource.mutateAsync({
        definition_id: definitionId,
        source: addingSource,
        source_text: newSourceText,
        source_article: newSourceArticle ? parseInt(newSourceArticle) : null,
        implementing_act_id: addingSource === 'implementing_act' ? (newImplementingActId || null) : null,
      });
      toast({ title: 'Source added successfully' });
      setAddingSource(null);
      setNewSourceText('');
      setNewSourceArticle('');
      setNewImplementingActId('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSource = async (sourceId: string, sourceName: string) => {
    if (!confirm(`Remove the ${getSourceLabel(sourceName as DefinitionSource)} version of this definition?`)) return;
    
    try {
      await deleteSource.mutateAsync(sourceId);
      toast({ title: 'Source removed successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const renderImplementingActSelector = (value: string, onChange: (val: string) => void) => (
    <div className="flex items-center gap-2">
      <Label className="text-xs whitespace-nowrap">Implementing Act:</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-8 w-full max-w-xs rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Select...</option>
        {implementingActs.map(ia => (
          <option key={ia.id} value={ia.id}>{ia.title}</option>
        ))}
      </select>
    </div>
  );

  if (isLoading) {
    return <div className="text-muted-foreground">Loading sources...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Source-Specific Definitions</Label>
        <div className="flex gap-2">
          {availableSources.map(source => (
            <Button
              key={source}
              variant="outline"
              size="sm"
              onClick={() => setAddingSource(source)}
              disabled={addingSource !== null}
            >
              <Plus className="h-3 w-3 mr-1" />
              {getSourceLabel(source)}
            </Button>
          ))}
        </div>
      </div>

      {/* Existing sources */}
      {sources.map(source => (
        <Card key={source.id} className="border-l-4" style={{ borderLeftColor: getSourceColor(source.source) }}>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Badge variant="secondary">{getSourceLabel(source.source)}</Badge>
                {source.source_article && (
                  <span className="text-xs text-muted-foreground">Art. {source.source_article}</span>
                )}
                {source.implementing_act_id && (
                  <span className="text-xs text-muted-foreground">
                    ({implementingActs.find(ia => ia.id === source.implementing_act_id)?.title || 'Linked IA'})
                  </span>
                )}
              </CardTitle>
              <div className="flex gap-1">
                {editingSource?.id !== source.id && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => handleStartEdit(source)}>
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteSource(source.id, source.source)}
                      disabled={sources.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            {editingSource?.id === source.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Article:</Label>
                    <Input
                      type="number"
                      value={editedArticle}
                      onChange={(e) => setEditedArticle(e.target.value)}
                      className="w-20 h-8"
                      placeholder="e.g. 2"
                    />
                  </div>
                  {source.source === 'implementing_act' && renderImplementingActSelector(editedImplementingActId, setEditedImplementingActId)}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setEditingSource(null)}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit} disabled={updateSource.isPending}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{source.source_text}</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add new source form */}
      {addingSource && (
        <Card className="border-dashed border-2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Badge>{getSourceLabel(addingSource)}</Badge>
              <span className="text-muted-foreground">— New source text</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={newSourceText}
              onChange={(e) => setNewSourceText(e.target.value)}
              rows={6}
              placeholder={`Enter the definition of "${definitionTerm}" as written in ${getSourceLabel(addingSource)}...`}
              className="font-mono text-sm"
            />
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Article:</Label>
                <Input
                  type="number"
                  value={newSourceArticle}
                  onChange={(e) => setNewSourceArticle(e.target.value)}
                  className="w-20 h-8"
                  placeholder="e.g. 2"
                />
              </div>
              {addingSource === 'implementing_act' && renderImplementingActSelector(newImplementingActId, setNewImplementingActId)}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => { setAddingSource(null); setNewImplementingActId(''); }}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSource} disabled={addSource.isPending || !newSourceText.trim()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Source
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {sources.length === 0 && !addingSource && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No source-specific texts yet. Add a source to show how this term is defined in each reference.
        </p>
      )}
    </div>
  );
};

function getSourceColor(source: DefinitionSource): string {
  switch (source) {
    case 'ehds_regulation':
      return 'hsl(var(--primary))';
    case 'eu_ehr_glossary':
      return 'hsl(142, 76%, 36%)';
    case 'xt_ehr':
      return 'hsl(262, 83%, 58%)';
    case 'implementing_act':
      return 'hsl(25, 95%, 53%)';
    default:
      return 'hsl(var(--muted))';
  }
}

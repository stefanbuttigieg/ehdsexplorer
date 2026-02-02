import { useState, useMemo } from 'react';
import { Merge, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getSourceLabel, type DefinitionSource } from '@/hooks/useDefinitions';

interface Definition {
  id: number;
  term: string;
  definition: string;
  source_article: number | null;
  source: DefinitionSource | null;
}

interface DefinitionMergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryDefinition: Definition | null;
  allDefinitions: Definition[];
}

export function DefinitionMergeDialog({
  open,
  onOpenChange,
  primaryDefinition,
  allDefinitions,
}: DefinitionMergeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecondary, setSelectedSecondary] = useState<Definition | null>(null);
  const [mergeStrategy, setMergeStrategy] = useState<'append' | 'replace' | 'prepend'>('append');
  const [isMerging, setIsMerging] = useState(false);

  const filteredDefinitions = useMemo(() => {
    if (!primaryDefinition) return [];
    return allDefinitions.filter(def => {
      if (def.id === primaryDefinition.id) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return def.term.toLowerCase().includes(query) || 
             def.definition.toLowerCase().includes(query);
    });
  }, [allDefinitions, primaryDefinition, searchQuery]);

  const handleMerge = async () => {
    if (!primaryDefinition || !selectedSecondary) return;
    
    setIsMerging(true);
    try {
      let mergedDefinition: string;
      
      switch (mergeStrategy) {
        case 'append':
          mergedDefinition = `${primaryDefinition.definition}\n\n---\n\n**Additional context (${getSourceLabel(selectedSecondary.source)}):**\n${selectedSecondary.definition}`;
          break;
        case 'prepend':
          mergedDefinition = `${selectedSecondary.definition}\n\n---\n\n**Original definition (${getSourceLabel(primaryDefinition.source)}):**\n${primaryDefinition.definition}`;
          break;
        case 'replace':
          mergedDefinition = selectedSecondary.definition;
          break;
        default:
          mergedDefinition = primaryDefinition.definition;
      }

      // Update primary definition with merged content
      const { error: updateError } = await supabase
        .from('definitions')
        .update({ definition: mergedDefinition })
        .eq('id', primaryDefinition.id);

      if (updateError) throw updateError;

      // Delete the secondary definition
      const { error: deleteError } = await supabase
        .from('definitions')
        .delete()
        .eq('id', selectedSecondary.id);

      if (deleteError) throw deleteError;

      toast({
        title: 'Definitions Merged',
        description: `"${selectedSecondary.term}" has been merged into "${primaryDefinition.term}" and deleted.`,
      });

      queryClient.invalidateQueries({ queryKey: ['admin-definitions'] });
      queryClient.invalidateQueries({ queryKey: ['definitions'] });
      onOpenChange(false);
      setSelectedSecondary(null);
      setSearchQuery('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to merge definitions',
        variant: 'destructive',
      });
    } finally {
      setIsMerging(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedSecondary(null);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Merge Definitions
          </DialogTitle>
          <DialogDescription>
            Merge another definition into "{primaryDefinition?.term}". The secondary definition will be deleted after merging.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Primary Definition Preview */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="default">Primary</Badge>
              <span className="font-medium">{primaryDefinition?.term}</span>
              <Badge variant="outline" className="text-xs">
                {getSourceLabel(primaryDefinition?.source || null)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {primaryDefinition?.definition.substring(0, 200)}...
            </p>
          </div>

          {/* Search for secondary definition */}
          <div className="space-y-2">
            <Label>Select definition to merge in:</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search definitions..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Definition list */}
          <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[200px]">
            <div className="space-y-2">
              {filteredDefinitions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No other definitions found
                </p>
              ) : (
                filteredDefinitions.map((def) => (
                  <div
                    key={def.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSecondary?.id === def.id
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                    onClick={() => setSelectedSecondary(def)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{def.term}</span>
                      <Badge variant="outline" className="text-xs">
                        {getSourceLabel(def.source)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {def.definition.substring(0, 150)}...
                    </p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Merge strategy */}
          {selectedSecondary && (
            <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{selectedSecondary.term}</Badge>
                <ArrowRight className="h-4 w-4" />
                <Badge variant="default">{primaryDefinition?.term}</Badge>
              </div>
              
              <Label>Merge Strategy:</Label>
              <RadioGroup
                value={mergeStrategy}
                onValueChange={(v) => setMergeStrategy(v as 'append' | 'replace' | 'prepend')}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="append" id="append" />
                  <Label htmlFor="append" className="text-sm cursor-pointer">
                    Append to end
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="prepend" id="prepend" />
                  <Label htmlFor="prepend" className="text-sm cursor-pointer">
                    Prepend to start
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="replace" id="replace" />
                  <Label htmlFor="replace" className="text-sm cursor-pointer">
                    Replace entirely
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleMerge} 
            disabled={!selectedSecondary || isMerging}
          >
            <Merge className="h-4 w-4 mr-2" />
            {isMerging ? 'Merging...' : 'Merge & Delete Secondary'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

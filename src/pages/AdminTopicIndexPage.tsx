import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useAllTopicIndex, groupTopicsByCategory, type TopicIndexItem } from '@/hooks/useTopicIndex';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STAKEHOLDER_TYPES = [
  { value: 'citizen', label: 'Citizens' },
  { value: 'healthtech', label: 'Health Tech' },
  { value: 'healthcare_professional', label: 'Healthcare Professionals' },
  { value: 'researcher', label: 'Researchers' },
  { value: 'policy_maker', label: 'Policy Makers' },
];

const stakeholderColors: Record<string, string> = {
  citizen: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  healthtech: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  healthcare_professional: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  researcher: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  policy_maker: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdminTopicIndexPage() {
  const { isLoading: guardLoading } = useAdminGuard();
  const { data: allTopics, isLoading } = useAllTopicIndex();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('citizen');
  const [editingTopic, setEditingTopic] = useState<Partial<TopicIndexItem> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const upsertMutation = useMutation({
    mutationFn: async (topic: Partial<TopicIndexItem>) => {
      const { error } = await supabase
        .from('topic_article_index')
        .upsert(topic as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-index'] });
      toast.success('Topic saved');
      setIsDialogOpen(false);
      setEditingTopic(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('topic_article_index')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topic-index'] });
      toast.success('Topic deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (guardLoading || isLoading) {
    return (
      <AdminPageLayout title="Topic Index" description="Loading...">
        <div className="text-center py-8">Loading...</div>
      </AdminPageLayout>
    );
  }

  const filteredTopics = allTopics?.filter(t => t.stakeholder_type === activeTab) || [];
  const groupedTopics = groupTopicsByCategory(filteredTopics);

  const handleSave = () => {
    if (!editingTopic?.topic || !editingTopic?.category) {
      toast.error('Topic and category are required');
      return;
    }
    upsertMutation.mutate(editingTopic);
  };

  const handleToggleActive = (topic: TopicIndexItem) => {
    upsertMutation.mutate({ ...topic, is_active: !topic.is_active });
  };

  const openNewDialog = () => {
    setEditingTopic({
      stakeholder_type: activeTab,
      category: '',
      topic: '',
      description: '',
      article_numbers: [],
      recital_numbers: [],
      sort_order: filteredTopics.length + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  return (
    <AdminPageLayout
      title="Topic Index"
      description="Manage topic-to-article mappings displayed on stakeholder landing pages"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="mb-6 w-full sm:w-auto">
            {STAKEHOLDER_TYPES.map(st => (
              <TabsTrigger 
                key={st.value} 
                value={st.value}
                className="gap-1 sm:gap-2 flex-1 sm:flex-initial text-xs sm:text-sm px-2 sm:px-4"
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{st.label}</span>
                <span className="sm:hidden">{st.label.slice(0, 3)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {STAKEHOLDER_TYPES.map(st => (
          <TabsContent key={st.value} value={st.value}>
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg">
                      {st.label} Topic Index
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {filteredTopics.length} topics mapped to articles
                    </CardDescription>
                  </div>
                  <Button onClick={openNewDialog} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" /> Add Topic
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {groupedTopics.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No topics configured for this stakeholder type yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {groupedTopics.map(({ category, items }) => (
                      <div key={category}>
                        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                          <Badge variant="outline">{category}</Badge>
                          <span className="text-muted-foreground">({items.length})</span>
                        </h3>
                        <ScrollArea className="w-full">
                          <div className="min-w-[600px]">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Topic</TableHead>
                                  <TableHead className="hidden md:table-cell">Description</TableHead>
                                  <TableHead>Articles</TableHead>
                                  <TableHead>Recitals</TableHead>
                                  <TableHead>Active</TableHead>
                                  <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items.map((topic) => (
                                  <TableRow key={topic.id}>
                                    <TableCell className="font-medium">{topic.topic}</TableCell>
                                    <TableCell className="hidden md:table-cell text-muted-foreground text-sm max-w-[200px] truncate">
                                      {topic.description}
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {topic.article_numbers.slice(0, 3).map(n => (
                                          <Badge key={n} variant="outline" className="text-xs">
                                            {n}
                                          </Badge>
                                        ))}
                                        {topic.article_numbers.length > 3 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{topic.article_numbers.length - 3}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex flex-wrap gap-1">
                                        {topic.recital_numbers.slice(0, 2).map(n => (
                                          <Badge key={n} variant="secondary" className="text-xs">
                                            {n}
                                          </Badge>
                                        ))}
                                        {topic.recital_numbers.length > 2 && (
                                          <span className="text-xs text-muted-foreground">
                                            +{topic.recital_numbers.length - 2}
                                          </span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Switch 
                                        checked={topic.is_active} 
                                        onCheckedChange={() => handleToggleActive(topic)} 
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex gap-1">
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => { setEditingTopic(topic); setIsDialogOpen(true); }}
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={() => deleteMutation.mutate(topic.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTopic?.id ? 'Edit' : 'Add'} Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stakeholder Type</Label>
                <Select 
                  value={editingTopic?.stakeholder_type || ''} 
                  onValueChange={(v) => setEditingTopic({ ...editingTopic, stakeholder_type: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {STAKEHOLDER_TYPES.map(st => (
                      <SelectItem key={st.value} value={st.value}>{st.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input 
                  value={editingTopic?.category || ''} 
                  onChange={(e) => setEditingTopic({ ...editingTopic, category: e.target.value })}
                  placeholder="e.g., Access Rights"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input 
                value={editingTopic?.topic || ''} 
                onChange={(e) => setEditingTopic({ ...editingTopic, topic: e.target.value })}
                placeholder="e.g., Access your health records"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={editingTopic?.description || ''} 
                onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                placeholder="Brief description of what this topic covers"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Article Numbers</Label>
                <Input 
                  value={editingTopic?.article_numbers?.join(', ') || ''} 
                  onChange={(e) => setEditingTopic({ 
                    ...editingTopic, 
                    article_numbers: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) 
                  })}
                  placeholder="3, 7, 12"
                />
              </div>
              <div className="space-y-2">
                <Label>Recital Numbers</Label>
                <Input 
                  value={editingTopic?.recital_numbers?.join(', ') || ''} 
                  onChange={(e) => setEditingTopic({ 
                    ...editingTopic, 
                    recital_numbers: e.target.value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) 
                  })}
                  placeholder="7, 8, 9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input 
                type="number" 
                value={editingTopic?.sort_order || 0} 
                onChange={(e) => setEditingTopic({ ...editingTopic, sort_order: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending} className="w-full sm:w-auto">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageLayout>
  );
}

import { useState, useEffect } from 'react';
import { Bot, Save, Edit2, BarChart3, Clock, Zap, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const AI_MODELS = [
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest & cheapest, good for simple tasks', tier: 'economy' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Balanced speed & quality', tier: 'standard' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Top-tier reasoning & multimodal', tier: 'premium' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)', description: 'Next-gen balanced model (recommended)', tier: 'recommended' },
  { id: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Preview)', description: 'Latest next-gen reasoning model', tier: 'preview' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', description: 'Fast & cost-efficient for simple tasks', tier: 'economy' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Strong performance, lower cost than full GPT-5', tier: 'standard' },
  { id: 'openai/gpt-5', label: 'GPT-5', description: 'Powerful all-rounder, excellent reasoning', tier: 'premium' },
  { id: 'openai/gpt-5.2', label: 'GPT-5.2', description: 'Latest with enhanced reasoning capabilities', tier: 'premium' },
];

const tierColors: Record<string, string> = {
  recommended: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  economy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  standard: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  preview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const categoryLabels: Record<string, string> = {
  system: '🔧 System',
  role: '👤 Role',
  level: '📊 Explanation Level',
};

interface PromptConfig {
  id: string;
  prompt_key: string;
  prompt_label: string;
  prompt_text: string;
  category: string;
  is_active: boolean;
  sort_order: number;
}

interface BenchmarkRow {
  id: string;
  model_used: string;
  role_used: string;
  explain_level: string;
  response_time_ms: number | null;
  user_query_preview: string | null;
  error_occurred: boolean;
  error_message: string | null;
  created_at: string;
  ip_address: string | null;
}

const AdminAISettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [isSaving, setIsSaving] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if ((settings as any)?.ai_model) {
      setSelectedModel((settings as any).ai_model);
    }
  }, [settings]);

  // Fetch prompts
  const { data: prompts = [] } = useQuery({
    queryKey: ['ai-prompts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_prompt_config')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as PromptConfig[];
    },
  });

  // Fetch benchmarks
  const { data: benchmarks = [] } = useQuery({
    queryKey: ['ai-benchmarks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_assistant_benchmarks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as BenchmarkRow[];
    },
  });

  // Fetch feedback stats
  const { data: feedbackStats } = useQuery({
    queryKey: ['ai-feedback-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_assistant_feedback')
        .select('feedback_type, created_at');
      if (error) throw error;
      const positive = data?.filter(f => f.feedback_type === 'positive').length || 0;
      const negative = data?.filter(f => f.feedback_type === 'negative').length || 0;
      return { positive, negative, total: positive + negative };
    },
  });

  const handleSaveModel = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('site_settings')
        .update({ ai_model: selectedModel, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('id', 'default');
      if (error) throw error;
      toast({ title: 'AI model updated', description: `Now using ${AI_MODELS.find(m => m.id === selectedModel)?.label}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrompt = async (prompt: PromptConfig) => {
    try {
      const { error } = await supabase
        .from('ai_prompt_config')
        .update({ prompt_text: editText })
        .eq('id', prompt.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
      setEditingPrompt(null);
      toast({ title: 'Prompt updated' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleTogglePrompt = async (prompt: PromptConfig) => {
    try {
      const { error } = await supabase
        .from('ai_prompt_config')
        .update({ is_active: !prompt.is_active })
        .eq('id', prompt.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['ai-prompts'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);

  // Benchmark stats
  const avgResponseTime = benchmarks.length > 0
    ? Math.round(benchmarks.filter(b => b.response_time_ms).reduce((sum, b) => sum + (b.response_time_ms || 0), 0) / benchmarks.filter(b => b.response_time_ms).length)
    : 0;
  const errorRate = benchmarks.length > 0
    ? Math.round((benchmarks.filter(b => b.error_occurred).length / benchmarks.length) * 100)
    : 0;
  const modelBreakdown = benchmarks.reduce((acc, b) => {
    acc[b.model_used] = (acc[b.model_used] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const roleBreakdown = benchmarks.reduce((acc, b) => {
    acc[b.role_used] = (acc[b.role_used] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const groupedPrompts = prompts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, PromptConfig[]>);

  return (
    <AdminPageLayout
      title="AI Settings"
      description="Configure the AI model, manage prompts, and view performance benchmarks"
    >
      <Tabs defaultValue="model" className="space-y-4">
        <TabsList>
          <TabsTrigger value="model"><Bot className="h-4 w-4 mr-1" />Model</TabsTrigger>
          <TabsTrigger value="prompts"><Edit2 className="h-4 w-4 mr-1" />Prompts</TabsTrigger>
          <TabsTrigger value="benchmarks"><BarChart3 className="h-4 w-4 mr-1" />Benchmarks</TabsTrigger>
        </TabsList>

        {/* MODEL TAB */}
        <TabsContent value="model">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Model Selection</CardTitle>
                <CardDescription>Choose which AI model powers all AI features site-wide.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Active Model</Label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.label}</span>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[model.tier]}`}>{model.tier}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {currentModel && (
                  <div className="rounded-md border p-3 bg-muted/50 text-sm text-muted-foreground">
                    <p><strong>{currentModel.label}</strong></p>
                    <p>{currentModel.description}</p>
                  </div>
                )}
                <Button onClick={handleSaveModel} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />{isSaving ? 'Saving...' : 'Save Model'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Affected Features</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {['AI Assistant (chat)', 'Plain language translations', 'Weekly news summary generation', 'Product updates summary generation'].map(f => (
                    <li key={f} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />{f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PROMPTS TAB */}
        <TabsContent value="prompts">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prompt Configuration</CardTitle>
                <CardDescription>Edit system prompts, role-specific instructions, and explanation levels. Changes take effect immediately for new conversations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(groupedPrompts).map(([category, categoryPrompts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold mb-3">{categoryLabels[category] || category}</h3>
                    <div className="space-y-3">
                      {categoryPrompts.map(prompt => (
                        <div key={prompt.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{prompt.prompt_label}</span>
                              <Badge variant="outline" className="text-[10px]">{prompt.prompt_key}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={prompt.is_active}
                                onCheckedChange={() => handleTogglePrompt(prompt)}
                              />
                              {editingPrompt === prompt.id ? (
                                <div className="flex gap-1">
                                  <Button size="sm" onClick={() => handleSavePrompt(prompt)}>
                                    <Save className="h-3 w-3 mr-1" />Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingPrompt(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <Button size="sm" variant="outline" onClick={() => { setEditingPrompt(prompt.id); setEditText(prompt.prompt_text); }}>
                                  <Edit2 className="h-3 w-3 mr-1" />Edit
                                </Button>
                              )}
                            </div>
                          </div>
                          {editingPrompt === prompt.id ? (
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-[200px] font-mono text-xs"
                            />
                          ) : (
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded p-3 max-h-[150px] overflow-y-auto">
                              {prompt.prompt_text}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* BENCHMARKS TAB */}
        <TabsContent value="benchmarks">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Zap className="h-4 w-4" />Total Requests</div>
                  <p className="text-2xl font-bold">{benchmarks.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><Clock className="h-4 w-4" />Avg Response</div>
                  <p className="text-2xl font-bold">{avgResponseTime ? `${(avgResponseTime / 1000).toFixed(1)}s` : '—'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1"><AlertTriangle className="h-4 w-4" />Error Rate</div>
                  <p className="text-2xl font-bold">{errorRate}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <ThumbsUp className="h-4 w-4" />/<ThumbsDown className="h-4 w-4" />Feedback
                  </div>
                  <p className="text-2xl font-bold">
                    {feedbackStats ? `${feedbackStats.positive}/${feedbackStats.negative}` : '—'}
                  </p>
                  {feedbackStats && feedbackStats.total > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round((feedbackStats.positive / feedbackStats.total) * 100)}% positive
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Breakdowns */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">By Model</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(modelBreakdown).sort((a, b) => b[1] - a[1]).map(([model, count]) => (
                      <div key={model} className="flex justify-between items-center text-sm">
                        <span className="truncate mr-2">{model.split('/').pop()}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(modelBreakdown).length === 0 && (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">By Role</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1]).map(([role, count]) => (
                      <div key={role} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{role}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                    {Object.keys(roleBreakdown).length === 0 && (
                      <p className="text-sm text-muted-foreground">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Requests */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Recent Requests</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Time</th>
                        <th className="text-left p-2">Model</th>
                        <th className="text-left p-2">Role</th>
                        <th className="text-left p-2">Response</th>
                        <th className="text-left p-2">Query</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {benchmarks.slice(0, 25).map(b => (
                        <tr key={b.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 whitespace-nowrap">{new Date(b.created_at).toLocaleString()}</td>
                          <td className="p-2">{b.model_used.split('/').pop()}</td>
                          <td className="p-2 capitalize">{b.role_used}</td>
                          <td className="p-2">{b.response_time_ms ? `${(b.response_time_ms / 1000).toFixed(1)}s` : '—'}</td>
                          <td className="p-2 max-w-[200px] truncate">{b.user_query_preview || '—'}</td>
                          <td className="p-2">
                            {b.error_occurred ? (
                              <Badge variant="destructive" className="text-[10px]">Error</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">OK</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {benchmarks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">No benchmark data yet. Data will appear after users interact with the AI assistant.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AdminPageLayout>
  );
};

export default AdminAISettingsPage;

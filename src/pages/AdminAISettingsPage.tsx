import { useState, useEffect } from 'react';
import { Bot, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';

const AI_MODELS = [
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Balanced speed & quality (recommended)', tier: 'recommended' },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', description: 'Fastest & cheapest, good for simple tasks', tier: 'economy' },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Top-tier reasoning & multimodal', tier: 'premium' },
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)', description: 'Next-gen balanced model', tier: 'preview' },
  { id: 'google/gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)', description: 'Next-gen top-tier model', tier: 'preview' },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', description: 'Fast & cost-efficient', tier: 'economy' },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Strong performance, lower cost than full GPT-5', tier: 'standard' },
  { id: 'openai/gpt-5', label: 'GPT-5', description: 'Powerful all-rounder, excellent reasoning', tier: 'premium' },
  { id: 'openai/gpt-5.2', label: 'GPT-5.2', description: 'Latest with enhanced reasoning', tier: 'premium' },
];

const tierColors: Record<string, string> = {
  recommended: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  economy: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  standard: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  premium: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  preview: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const AdminAISettingsPage = () => {
  const { toast } = useToast();
  const { data: settings } = useSiteSettings();
  const [selectedModel, setSelectedModel] = useState('google/gemini-2.5-flash');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if ((settings as any)?.ai_model) {
      setSelectedModel((settings as any).ai_model);
    }
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('site_settings')
        .update({
          ai_model: selectedModel,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        })
        .eq('id', 'default');

      if (error) throw error;

      toast({ title: 'AI model updated', description: `Now using ${AI_MODELS.find(m => m.id === selectedModel)?.label}` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentModel = AI_MODELS.find(m => m.id === selectedModel);

  return (
    <AdminPageLayout
      title="AI Settings"
      description="Configure the AI model used across all AI-powered features"
    >
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">AI Model Selection</CardTitle>
            <CardDescription>
              Choose which AI model powers the assistant, plain language translations, and news summaries. Changes apply to all AI features site-wide.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Active Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center gap-2">
                        <span>{model.label}</span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierColors[model.tier]}`}>
                          {model.tier}
                        </Badge>
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

            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Model'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Affected Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                AI Assistant (chat)
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Plain language translations
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Weekly news summary generation
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Product updates summary generation
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminPageLayout>
  );
};

export default AdminAISettingsPage;

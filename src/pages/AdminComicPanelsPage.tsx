import { useState } from 'react';
import { AdminPageLayout } from '@/components/admin/AdminPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { comicStories } from '@/data/comicStories';
import { useComicPanelImages } from '@/hooks/useComicPanelImages';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Trash2, Image, CheckCircle, Loader2, BookOpen } from 'lucide-react';

export default function AdminComicPanelsPage() {
  const [selectedStory, setSelectedStory] = useState<string | null>(null);
  const story = comicStories.find(s => s.id === selectedStory);
  const { imageMap, isLoading, upsertImage, deleteImage } = useComicPanelImages(selectedStory ?? undefined);
  const [generating, setGenerating] = useState<number | null>(null);

  const generatePanel = async (panelIndex: number) => {
    if (!story) return;
    setGenerating(panelIndex);
    try {
      const prompt = panelIndex === -1 ? story.coverPrompt : story.panels[panelIndex].imagePrompt;

      const { data, error } = await supabase.functions.invoke('generate-comic-panel', {
        body: { imagePrompt: prompt, storyTitle: story.title },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.imageUrl) {
        await upsertImage.mutateAsync({
          storyId: story.id,
          panelIndex,
          imageUrl: data.imageUrl,
        });
        toast.success(`Panel ${panelIndex === -1 ? 'cover' : panelIndex + 1} generated and saved!`);
      }
    } catch (err) {
      console.error('Failed to generate panel:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (panelIndex: number) => {
    if (!story) return;
    try {
      await deleteImage.mutateAsync({ storyId: story.id, panelIndex });
      toast.success('Image deleted');
    } catch {
      toast.error('Failed to delete image');
    }
  };

  const allPanelIndices = story ? [-1, ...story.panels.map((_, i) => i)] : [];
  const totalPanels = allPanelIndices.length;
  const generatedCount = allPanelIndices.filter(i => imageMap[i]).length;

  return (
    <AdminPageLayout
      title="Comic Panel Images"
      description="Pre-generate and manage AI comic panel artwork. Images are stored and served to users without re-generating."
    >
      {!selectedStory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comicStories.map(s => (
            <Card
              key={s.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setSelectedStory(s.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{s.title}</CardTitle>
                    <CardDescription>{s.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">{s.panels.length + 1} panels (cover + {s.panels.length})</p>
                <Badge variant="outline">{s.ageGroup === '10-13' ? 'Ages 10–13' : 'Ages 14–17'}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <Button variant="ghost" onClick={() => setSelectedStory(null)} className="mb-2">
                ← Back to stories
              </Button>
              <h2 className="text-xl font-bold">{story?.title}</h2>
              <p className="text-sm text-muted-foreground">
                {generatedCount} / {totalPanels} panels generated
              </p>
            </div>
            <Button
              onClick={async () => {
                for (const idx of allPanelIndices) {
                  if (!imageMap[idx]) {
                    await generatePanel(idx);
                  }
                }
              }}
              disabled={generating !== null || generatedCount === totalPanels}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate All Missing
            </Button>
          </div>

          <div className="space-y-4">
            {allPanelIndices.map(idx => {
              const label = idx === -1 ? 'Cover' : `Panel ${idx + 1}`;
              const prompt = idx === -1 ? story?.coverPrompt : story?.panels[idx]?.imagePrompt;
              const hasImage = !!imageMap[idx];
              const isGenerating = generating === idx;

              return (
                <Card key={idx}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Image preview */}
                      <div className="w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                        {isGenerating ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        ) : hasImage ? (
                          <img
                            src={imageMap[idx]}
                            alt={label}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{label}</span>
                          {hasImage && (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" /> Generated
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {prompt}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => generatePanel(idx)}
                            disabled={isGenerating || generating !== null}
                            className="gap-1"
                          >
                            <Sparkles className="h-3 w-3" />
                            {hasImage ? 'Regenerate' : 'Generate'}
                          </Button>
                          {hasImage && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(idx)}
                              className="gap-1"
                            >
                              <Trash2 className="h-3 w-3" /> Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

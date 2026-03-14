import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ComicPanelImage {
  id: string;
  story_id: string;
  panel_index: number;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export function useComicPanelImages(storyId?: string) {
  const queryClient = useQueryClient();

  const { data: panelImages, isLoading } = useQuery({
    queryKey: ['comic-panel-images', storyId],
    queryFn: async () => {
      let query = supabase
        .from('comic_panel_images' as any)
        .select('*');
      
      if (storyId) {
        query = query.eq('story_id', storyId);
      }
      
      const { data, error } = await query.order('panel_index');
      if (error) throw error;
      return (data as unknown as ComicPanelImage[]) ?? [];
    },
  });

  const upsertImage = useMutation({
    mutationFn: async ({ storyId, panelIndex, imageUrl }: { storyId: string; panelIndex: number; imageUrl: string }) => {
      const { error } = await (supabase
        .from('comic_panel_images' as any) as any)
        .upsert(
          { story_id: storyId, panel_index: panelIndex, image_url: imageUrl },
          { onConflict: 'story_id,panel_index' }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comic-panel-images'] });
    },
  });

  const deleteImage = useMutation({
    mutationFn: async ({ storyId, panelIndex }: { storyId: string; panelIndex: number }) => {
      const { error } = await (supabase
        .from('comic_panel_images' as any) as any)
        .delete()
        .eq('story_id', storyId)
        .eq('panel_index', panelIndex);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comic-panel-images'] });
    },
  });

  // Build a lookup map: panelIndex -> imageUrl
  const imageMap: Record<number, string> = {};
  panelImages?.forEach(img => {
    imageMap[img.panel_index] = img.image_url;
  });

  return { panelImages, imageMap, isLoading, upsertImage, deleteImage };
}

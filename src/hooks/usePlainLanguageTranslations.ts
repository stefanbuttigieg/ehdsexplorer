import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PlainLanguageTranslation {
  id: string;
  content_type: "article" | "recital";
  content_id: number;
  plain_language_text: string;
  is_published: boolean;
  generated_by: "ai" | "manual";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const usePlainLanguageTranslations = () => {
  return useQuery({
    queryKey: ["plain-language-translations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plain_language_translations")
        .select("*")
        .order("content_type")
        .order("content_id");

      if (error) throw error;
      return data as PlainLanguageTranslation[];
    },
  });
};

export const usePlainLanguageTranslation = (
  contentType: "article" | "recital",
  contentId: number
) => {
  return useQuery({
    queryKey: ["plain-language-translation", contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plain_language_translations")
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .maybeSingle();

      if (error) throw error;
      return data as PlainLanguageTranslation | null;
    },
  });
};

export const usePublishedTranslation = (
  contentType: "article" | "recital",
  contentId: number
) => {
  return useQuery({
    queryKey: ["published-translation", contentType, contentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plain_language_translations")
        .select("*")
        .eq("content_type", contentType)
        .eq("content_id", contentId)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as PlainLanguageTranslation | null;
    },
  });
};

export const useGenerateTranslation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
    }: {
      contentType: "article" | "recital";
      contentId: number;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "generate-plain-language",
        {
          body: { contentType, contentId },
        }
      );

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translation", variables.contentType, variables.contentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translations"],
      });
      toast({
        title: "Translation generated",
        description: "AI translation has been generated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message || "Failed to generate translation",
        variant: "destructive",
      });
    },
  });
};

export const useSaveTranslation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contentType,
      contentId,
      plainLanguageText,
      isPublished = false,
      generatedBy = "ai",
    }: {
      contentType: "article" | "recital";
      contentId: number;
      plainLanguageText: string;
      isPublished?: boolean;
      generatedBy?: "ai" | "manual";
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("plain_language_translations")
        .upsert(
          {
            content_type: contentType,
            content_id: contentId,
            plain_language_text: plainLanguageText,
            is_published: isPublished,
            generated_by: generatedBy,
            reviewed_by: user.user?.id || null,
            reviewed_at: new Date().toISOString(),
          },
          {
            onConflict: "content_type,content_id",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translation", variables.contentType, variables.contentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["published-translation", variables.contentType, variables.contentId],
      });
      toast({
        title: "Translation saved",
        description: variables.isPublished 
          ? "Translation has been published." 
          : "Translation has been saved as draft.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Save failed",
        description: error.message || "Failed to save translation",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteTranslation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("plain_language_translations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translations"],
      });
      toast({
        title: "Translation deleted",
        description: "Translation has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete translation",
        variant: "destructive",
      });
    },
  });
};

export interface BatchGenerationProgress {
  total: number;
  completed: number;
  current: { type: string; id: number } | null;
  results: Array<{ type: string; id: number; success: boolean; error?: string }>;
}

export const useBatchGenerateTranslations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      items,
      onProgress,
    }: {
      items: Array<{ contentType: "article" | "recital"; contentId: number }>;
      onProgress?: (progress: BatchGenerationProgress) => void;
    }) => {
      const results: BatchGenerationProgress["results"] = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        onProgress?.({
          total: items.length,
          completed: i,
          current: { type: item.contentType, id: item.contentId },
          results,
        });

        try {
          const { data, error } = await supabase.functions.invoke(
            "generate-plain-language",
            {
              body: { contentType: item.contentType, contentId: item.contentId },
            }
          );

          if (error) throw error;

          // Auto-save as draft
          const { data: user } = await supabase.auth.getUser();
          await supabase
            .from("plain_language_translations")
            .upsert(
              {
                content_type: item.contentType,
                content_id: item.contentId,
                plain_language_text: data.plainLanguageText,
                is_published: false,
                generated_by: "ai",
                reviewed_by: user.user?.id || null,
                reviewed_at: new Date().toISOString(),
              },
              {
                onConflict: "content_type,content_id",
              }
            );

          results.push({ type: item.contentType, id: item.contentId, success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.push({ type: item.contentType, id: item.contentId, success: false, error: errorMessage });
        }

        // Small delay to avoid rate limiting
        if (i < items.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      onProgress?.({
        total: items.length,
        completed: items.length,
        current: null,
        results,
      });

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translations"],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Batch generation failed",
        description: error.message || "Failed to complete batch generation",
        variant: "destructive",
      });
    },
  });
};

export interface BulkPublishProgress {
  total: number;
  completed: number;
  results: Array<{ type: string; id: number; success: boolean; error?: string }>;
}

export const useBulkPublishTranslations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      translationIds,
      translations,
      onProgress,
    }: {
      translationIds: string[];
      translations: PlainLanguageTranslation[];
      onProgress?: (progress: BulkPublishProgress) => void;
    }) => {
      const results: BulkPublishProgress["results"] = [];
      const { data: user } = await supabase.auth.getUser();

      for (let i = 0; i < translationIds.length; i++) {
        const id = translationIds[i];
        const translation = translations.find(t => t.id === id);

        try {
          const { error } = await supabase
            .from("plain_language_translations")
            .update({
              is_published: true,
              reviewed_by: user.user?.id || null,
              reviewed_at: new Date().toISOString(),
            })
            .eq("id", id);

          if (error) throw error;

          results.push({
            type: translation?.content_type || "unknown",
            id: translation?.content_id || 0,
            success: true,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          results.push({
            type: translation?.content_type || "unknown",
            id: translation?.content_id || 0,
            success: false,
            error: errorMessage,
          });
        }

        onProgress?.({
          total: translationIds.length,
          completed: i + 1,
          results,
        });
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translations"],
      });
      // Also invalidate individual translation queries
      queryClient.invalidateQueries({
        queryKey: ["plain-language-translation"],
      });
      queryClient.invalidateQueries({
        queryKey: ["published-translation"],
      });

      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Bulk publish complete",
        description: `Successfully published ${successCount} of ${results.length} translations.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk publish failed",
        description: error.message || "Failed to complete bulk publish",
        variant: "destructive",
      });
    },
  });
};

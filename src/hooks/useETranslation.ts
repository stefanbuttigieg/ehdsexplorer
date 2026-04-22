import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ETranslationTargetType =
  | "snippet"
  | "ui_string"
  | "article"
  | "recital"
  | "definition"
  | "annex"
  | "chapter"
  | "section"
  | "implementing_act"
  | "news";

export interface SubmitETranslationParams {
  text: string;
  targetLanguage: string; // ISO code like "FR", "DE", "ES" — eTranslation expects uppercase
  sourceLanguage?: string;
  domain?: string;
  targetType?: ETranslationTargetType;
  targetId?: string;
  targetField?: string;
  metadata?: Record<string, unknown>;
}

export interface TranslationJob {
  id: string;
  source_language: string;
  target_language: string;
  source_text: string;
  translated_text: string | null;
  status: "pending" | "completed" | "failed" | string;
  error_message: string | null;
  target_type: string;
  target_id: string | null;
  target_field: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/**
 * Submit a translation request to the European Commission's eTranslation
 * service. The request is asynchronous — the translated text arrives via
 * the `etranslation-callback` edge function which updates the job row.
 * Use `useTranslationJob(jobId)` to poll for completion.
 */
export function useSubmitETranslation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: SubmitETranslationParams) => {
      const { data, error } = await supabase.functions.invoke(
        "etranslation-submit",
        { body: params }
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { success: true; jobId: string; ecRequestId: string | number };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["translation-jobs"] });
    },
    onError: (err: Error) => {
      toast.error("eTranslation request failed: " + err.message);
    },
  });
}

/**
 * Poll a single translation job until it completes or fails.
 */
export function useTranslationJob(jobId: string | null | undefined) {
  return useQuery({
    queryKey: ["translation-job", jobId],
    enabled: !!jobId,
    refetchInterval: (query) => {
      const job = query.state.data as TranslationJob | undefined;
      if (!job) return 2000;
      return job.status === "pending" ? 2000 : false;
    },
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translation_jobs")
        .select("*")
        .eq("id", jobId!)
        .maybeSingle();
      if (error) throw error;
      return data as TranslationJob | null;
    },
  });
}

/**
 * List recent translation jobs (admin view).
 */
export function useTranslationJobs(limit = 50) {
  return useQuery({
    queryKey: ["translation-jobs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("translation_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as TranslationJob[];
    },
  });
}
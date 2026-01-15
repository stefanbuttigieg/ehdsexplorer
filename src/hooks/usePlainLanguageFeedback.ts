import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Generate a session ID for anonymous feedback tracking
const getSessionId = () => {
  let sessionId = sessionStorage.getItem("feedback_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("feedback_session_id", sessionId);
  }
  return sessionId;
};

export const usePlainLanguageFeedback = (translationId: string) => {
  const [feedbackGiven, setFeedbackGiven] = useState<"positive" | "negative" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitFeedback = async (type: "positive" | "negative", comment?: string) => {
    if (feedbackGiven) return; // Already submitted
    
    setIsSubmitting(true);
    try {
      // Use edge function for rate-limited feedback submission
      const response = await supabase.functions.invoke("submit-feedback", {
        body: {
          translation_id: translationId,
          feedback_type: type,
          session_id: getSessionId(),
          comment: comment?.trim() || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to submit feedback");
      }

      // Check for rate limit response
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      setFeedbackGiven(type);
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the plain language translations.",
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      const errorMessage = error instanceof Error ? error.message : "Please try again later.";
      toast({
        title: "Failed to submit feedback",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    feedbackGiven,
    isSubmitting,
    submitFeedback,
  };
};

// Admin hook to fetch all feedback with translation details
export const usePlainLanguageFeedbackList = () => {
  return useQuery({
    queryKey: ["plain-language-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plain_language_feedback")
        .select(`
          id,
          translation_id,
          feedback_type,
          comment,
          session_id,
          created_at,
          plain_language_translations (
            content_type,
            content_id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

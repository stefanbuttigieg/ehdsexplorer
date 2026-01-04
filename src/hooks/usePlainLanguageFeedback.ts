import { useState } from "react";
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

  const submitFeedback = async (type: "positive" | "negative") => {
    if (feedbackGiven) return; // Already submitted
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("plain_language_feedback")
        .insert({
          translation_id: translationId,
          feedback_type: type,
          session_id: getSessionId(),
        });

      if (error) throw error;
      
      setFeedbackGiven(type);
      toast({
        title: "Thank you for your feedback!",
        description: "Your input helps us improve the plain language translations.",
      });
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
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

-- Create table for AI assistant feedback
CREATE TABLE public.ai_assistant_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_content text NOT NULL,
  user_query text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_assistant_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.ai_assistant_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.ai_assistant_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.ai_assistant_feedback
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Create index for analytics queries
CREATE INDEX idx_ai_feedback_type ON public.ai_assistant_feedback(feedback_type);
CREATE INDEX idx_ai_feedback_created ON public.ai_assistant_feedback(created_at DESC);
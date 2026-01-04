-- Create table for plain language translation feedback
CREATE TABLE public.plain_language_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  translation_id UUID NOT NULL REFERENCES public.plain_language_translations(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
  comment TEXT,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plain_language_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (no auth required for anonymous feedback)
CREATE POLICY "Anyone can submit feedback"
ON public.plain_language_feedback
FOR INSERT
WITH CHECK (true);

-- Admins can view all feedback
CREATE POLICY "Admins can view feedback"
ON public.plain_language_feedback
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
ON public.plain_language_feedback
FOR DELETE
USING (is_admin_or_editor(auth.uid()));
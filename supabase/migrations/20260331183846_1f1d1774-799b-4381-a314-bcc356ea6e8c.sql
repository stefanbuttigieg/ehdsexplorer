
-- Allow anonymous feedback submissions
ALTER TABLE public.ai_assistant_feedback ALTER COLUMN user_id DROP NOT NULL;

-- Drop old insert policy and create a more permissive one
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.ai_assistant_feedback;

CREATE POLICY "Anyone can insert feedback" ON public.ai_assistant_feedback
  FOR INSERT WITH CHECK (true);

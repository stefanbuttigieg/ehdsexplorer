
CREATE TABLE public.study_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('faq', 'article', 'recital')),
  content_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'reviewing', 'mastered')),
  review_count INT NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

ALTER TABLE public.study_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study progress"
  ON public.study_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own study progress"
  ON public.study_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study progress"
  ON public.study_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study progress"
  ON public.study_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_study_progress_updated_at
  BEFORE UPDATE ON public.study_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

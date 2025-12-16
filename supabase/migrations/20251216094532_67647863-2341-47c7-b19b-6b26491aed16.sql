-- Create news_summaries table for AI-generated EHDS news
CREATE TABLE public.news_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by TEXT DEFAULT 'ai',
  is_published BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.news_summaries ENABLE ROW LEVEL SECURITY;

-- Public read access for published summaries
CREATE POLICY "Anyone can view published news summaries"
ON public.news_summaries
FOR SELECT
USING (is_published = true);

-- Admin/editor full access
CREATE POLICY "Admins and editors can manage news summaries"
ON public.news_summaries
FOR ALL
USING (public.is_admin_or_editor(auth.uid()));

-- Create index for efficient querying
CREATE INDEX idx_news_summaries_week ON public.news_summaries(week_start DESC);
CREATE INDEX idx_news_summaries_published ON public.news_summaries(is_published) WHERE is_published = true;

-- Add trigger for updated_at
CREATE TRIGGER update_news_summaries_updated_at
BEFORE UPDATE ON public.news_summaries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
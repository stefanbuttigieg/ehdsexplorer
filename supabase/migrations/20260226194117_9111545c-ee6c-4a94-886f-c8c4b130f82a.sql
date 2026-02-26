
-- Create table for LinkedIn posts linked to implementing acts
CREATE TABLE public.implementing_act_linkedin_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementing_act_id TEXT NOT NULL,
  post_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  author_name TEXT,
  posted_at DATE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.implementing_act_linkedin_posts ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view LinkedIn posts"
ON public.implementing_act_linkedin_posts
FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage LinkedIn posts"
ON public.implementing_act_linkedin_posts
FOR ALL
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Index for fast lookup
CREATE INDEX idx_linkedin_posts_implementing_act_id ON public.implementing_act_linkedin_posts(implementing_act_id);

-- Timestamp trigger
CREATE TRIGGER update_linkedin_posts_updated_at
BEFORE UPDATE ON public.implementing_act_linkedin_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

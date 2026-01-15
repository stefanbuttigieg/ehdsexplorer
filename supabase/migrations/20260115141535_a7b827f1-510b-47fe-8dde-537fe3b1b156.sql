-- Create onboarding steps table for admin-managed content
CREATE TABLE public.onboarding_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'star',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_steps ENABLE ROW LEVEL SECURITY;

-- Public read access for active steps
CREATE POLICY "Anyone can view active onboarding steps"
  ON public.onboarding_steps
  FOR SELECT
  USING (is_active = true);

-- Admin/editor can manage onboarding steps
CREATE POLICY "Admins and editors can manage onboarding steps"
  ON public.onboarding_steps
  FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

-- Seed with default onboarding steps
INSERT INTO public.onboarding_steps (step_order, title, description, icon) VALUES
(1, 'Explore the Regulation', 'Browse 105 Articles, 115 Recitals, and 62+ Definitions with smart cross-references.', 'book'),
(2, 'Save Your Progress', 'Bookmark articles, take notes, and track your reading progress across devices.', 'bookmark'),
(3, 'Stay Updated', 'Get alerts on implementing acts feedback deadlines and weekly news summaries.', 'bell'),
(4, 'Collaborate with Teams', 'Share annotations and bookmarks with your colleagues in team workspaces.', 'users');
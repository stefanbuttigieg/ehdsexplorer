-- Create implementing_act_recitals table
CREATE TABLE public.implementing_act_recitals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementing_act_id text NOT NULL REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  recital_number integer NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create implementing_act_articles table
CREATE TABLE public.implementing_act_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementing_act_id text NOT NULL REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  article_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  section_id uuid NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create implementing_act_sections table for article grouping
CREATE TABLE public.implementing_act_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementing_act_id text NOT NULL REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  section_number integer NOT NULL,
  title text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add section reference to articles
ALTER TABLE public.implementing_act_articles
ADD CONSTRAINT implementing_act_articles_section_fkey
FOREIGN KEY (section_id) REFERENCES public.implementing_act_sections(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_ia_recitals_act_id ON public.implementing_act_recitals(implementing_act_id);
CREATE INDEX idx_ia_articles_act_id ON public.implementing_act_articles(implementing_act_id);
CREATE INDEX idx_ia_sections_act_id ON public.implementing_act_sections(implementing_act_id);
CREATE INDEX idx_ia_articles_section ON public.implementing_act_articles(section_id);

-- Enable RLS on all tables
ALTER TABLE public.implementing_act_recitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_sections ENABLE ROW LEVEL SECURITY;

-- RLS policies for implementing_act_recitals
CREATE POLICY "Anyone can read implementing act recitals"
ON public.implementing_act_recitals FOR SELECT
USING (true);

CREATE POLICY "Admins can insert implementing act recitals"
ON public.implementing_act_recitals FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update implementing act recitals"
ON public.implementing_act_recitals FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete implementing act recitals"
ON public.implementing_act_recitals FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- RLS policies for implementing_act_articles
CREATE POLICY "Anyone can read implementing act articles"
ON public.implementing_act_articles FOR SELECT
USING (true);

CREATE POLICY "Admins can insert implementing act articles"
ON public.implementing_act_articles FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update implementing act articles"
ON public.implementing_act_articles FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete implementing act articles"
ON public.implementing_act_articles FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- RLS policies for implementing_act_sections
CREATE POLICY "Anyone can read implementing act sections"
ON public.implementing_act_sections FOR SELECT
USING (true);

CREATE POLICY "Admins can insert implementing act sections"
ON public.implementing_act_sections FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update implementing act sections"
ON public.implementing_act_sections FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete implementing act sections"
ON public.implementing_act_sections FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_ia_recitals_updated_at
BEFORE UPDATE ON public.implementing_act_recitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_articles_updated_at
BEFORE UPDATE ON public.implementing_act_articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ia_sections_updated_at
BEFORE UPDATE ON public.implementing_act_sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
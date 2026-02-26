
-- Table to cache scraped Comitology Register updates
CREATE TABLE public.comitology_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  scraped_content TEXT,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public read access
ALTER TABLE public.comitology_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comitology updates"
  ON public.comitology_updates FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage comitology updates"
  ON public.comitology_updates FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

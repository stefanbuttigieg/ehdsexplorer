
-- Table for storing scraped EU regulation updates
CREATE TABLE public.eu_regulation_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source_url TEXT NOT NULL,
  scraped_content TEXT,
  content_hash TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'dismissed', 'actioned')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eu_regulation_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view eu_regulation_updates"
  ON public.eu_regulation_updates FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can insert eu_regulation_updates"
  ON public.eu_regulation_updates FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update eu_regulation_updates"
  ON public.eu_regulation_updates FOR UPDATE
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete eu_regulation_updates"
  ON public.eu_regulation_updates FOR DELETE
  USING (public.is_admin_or_editor(auth.uid()));

-- Allow service role to insert (from edge function)
CREATE POLICY "Service role can insert eu_regulation_updates"
  ON public.eu_regulation_updates FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_eu_regulation_updates_updated_at
  BEFORE UPDATE ON public.eu_regulation_updates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Config table for scraping settings
CREATE TABLE public.eu_regulation_check_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_url TEXT NOT NULL DEFAULT 'https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/15673-European-Health-Data-Space-dataset-descriptions_en',
  check_times TEXT[] NOT NULL DEFAULT ARRAY['08:00', '12:00', '18:00'],
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  last_content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eu_regulation_check_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage eu_regulation_check_config"
  ON public.eu_regulation_check_config FOR ALL
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_eu_regulation_check_config_updated_at
  BEFORE UPDATE ON public.eu_regulation_check_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default config row
INSERT INTO public.eu_regulation_check_config (target_url) VALUES (
  'https://ec.europa.eu/info/law/better-regulation/have-your-say/initiatives/15673-European-Health-Data-Space-dataset-descriptions_en'
);

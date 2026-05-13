
CREATE TABLE public.seo_keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  database TEXT NOT NULL DEFAULT 'uk',
  search_volume INTEGER,
  cpc NUMERIC,
  competition NUMERIC,
  difficulty INTEGER,
  our_position INTEGER,
  our_url TEXT,
  notes TEXT,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.seo_serp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID NOT NULL REFERENCES public.seo_keyword_rankings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_serp_snapshots_keyword ON public.seo_serp_snapshots(keyword_id, captured_at DESC);

ALTER TABLE public.seo_keyword_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_serp_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage seo_keyword_rankings" ON public.seo_keyword_rankings
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins manage seo_serp_snapshots" ON public.seo_serp_snapshots
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER trg_seo_keyword_rankings_updated_at
  BEFORE UPDATE ON public.seo_keyword_rankings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

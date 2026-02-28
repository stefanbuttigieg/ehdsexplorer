
-- Table for admin-managed disclaimer banners
CREATE TABLE public.site_disclaimers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'warning',
  is_active BOOLEAN NOT NULL DEFAULT true,
  placement TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_disclaimers ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read active disclaimers"
  ON public.site_disclaimers FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Admins can manage disclaimers"
  ON public.site_disclaimers FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_site_disclaimers_updated_at
  BEFORE UPDATE ON public.site_disclaimers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the current implementation disclaimer
INSERT INTO public.site_disclaimers (id, title, message, variant, is_active, placement)
VALUES (
  'implementation-data-update',
  'Data update in progress',
  'Implementation tracking data is currently being updated across all member states. You will be notified once the update is complete.',
  'warning',
  true,
  ARRAY['implementation_tracker', 'country_map_implementation']
);

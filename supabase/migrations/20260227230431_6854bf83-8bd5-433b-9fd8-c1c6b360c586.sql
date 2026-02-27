-- Join table linking country legislation to specific EHDS obligations
CREATE TABLE public.legislation_obligation_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  legislation_id UUID NOT NULL REFERENCES public.country_legislation(id) ON DELETE CASCADE,
  obligation_id TEXT NOT NULL REFERENCES public.ehds_obligations(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  UNIQUE(legislation_id, obligation_id)
);

-- Enable RLS
ALTER TABLE public.legislation_obligation_links ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view legislation-obligation links"
  ON public.legislation_obligation_links
  FOR SELECT
  USING (true);

-- Admin/editor write access
CREATE POLICY "Admins can manage legislation-obligation links"
  ON public.legislation_obligation_links
  FOR ALL
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));
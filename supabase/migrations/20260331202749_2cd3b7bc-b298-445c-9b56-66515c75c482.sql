-- Add source_recitals column for linking FAQs to recitals
ALTER TABLE public.ehds_faqs ADD COLUMN IF NOT EXISTS source_recitals text[] DEFAULT '{}';

-- Add document_version column for human-readable version label
ALTER TABLE public.ehds_faqs ADD COLUMN IF NOT EXISTS document_version text;

-- Create version tracking table
CREATE TABLE IF NOT EXISTS public.ehds_faq_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_label text NOT NULL,
  pdf_hash text,
  pdf_url text,
  release_date date,
  notes text,
  faqs_updated_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ehds_faq_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view FAQ versions" ON public.ehds_faq_versions
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage FAQ versions" ON public.ehds_faq_versions
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_ehds_faq_versions_updated_at
  BEFORE UPDATE ON public.ehds_faq_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create ehds_faqs table
CREATE TABLE public.ehds_faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_number INTEGER NOT NULL UNIQUE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  rich_content TEXT,
  chapter TEXT NOT NULL,
  sub_category TEXT,
  source_articles TEXT[],
  source_references TEXT,
  is_published BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  pdf_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ehds_faq_footnotes table
CREATE TABLE public.ehds_faq_footnotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id UUID REFERENCES public.ehds_faqs(id) ON DELETE CASCADE NOT NULL,
  marker TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create ehds_faq_sync_log table
CREATE TABLE public.ehds_faq_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdf_url TEXT,
  pdf_hash TEXT,
  faqs_parsed INTEGER,
  footnotes_parsed INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ehds_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehds_faq_footnotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehds_faq_sync_log ENABLE ROW LEVEL SECURITY;

-- Public read on ehds_faqs
CREATE POLICY "Anyone can read published FAQs"
  ON public.ehds_faqs FOR SELECT
  USING (is_published = true);

-- Admin write on ehds_faqs
CREATE POLICY "Admins can manage FAQs"
  ON public.ehds_faqs FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Public read on ehds_faq_footnotes
CREATE POLICY "Anyone can read FAQ footnotes"
  ON public.ehds_faq_footnotes FOR SELECT
  USING (true);

-- Admin write on ehds_faq_footnotes
CREATE POLICY "Admins can manage FAQ footnotes"
  ON public.ehds_faq_footnotes FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Admin read/write on sync log
CREATE POLICY "Admins can read sync logs"
  ON public.ehds_faq_sync_log FOR SELECT
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can insert sync logs"
  ON public.ehds_faq_sync_log FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Service role needs full access for edge functions
CREATE POLICY "Service role full access FAQs"
  ON public.ehds_faqs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access footnotes"
  ON public.ehds_faq_footnotes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access sync log"
  ON public.ehds_faq_sync_log FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_ehds_faqs_updated_at
  BEFORE UPDATE ON public.ehds_faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

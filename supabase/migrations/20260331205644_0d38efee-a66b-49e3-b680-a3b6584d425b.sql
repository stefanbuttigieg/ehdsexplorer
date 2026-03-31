-- FAQ Data Tables (mirroring implementing act data tables pattern)
CREATE TABLE public.ehds_faq_data_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faq_id UUID NOT NULL REFERENCES public.ehds_faqs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.ehds_faq_data_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.ehds_faq_data_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  column_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE public.ehds_faq_data_rows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.ehds_faq_data_tables(id) ON DELETE CASCADE,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.ehds_faq_data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehds_faq_data_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehds_faq_data_rows ENABLE ROW LEVEL SECURITY;

-- Public read for published tables
CREATE POLICY "Public can view published FAQ data tables" ON public.ehds_faq_data_tables FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view FAQ data columns" ON public.ehds_faq_data_columns FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ehds_faq_data_tables t WHERE t.id = table_id AND t.is_published = true)
);
CREATE POLICY "Public can view FAQ data rows" ON public.ehds_faq_data_rows FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ehds_faq_data_tables t WHERE t.id = table_id AND t.is_published = true)
);

-- Admin/editor write access
CREATE POLICY "Admins can manage FAQ data tables" ON public.ehds_faq_data_tables FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage FAQ data columns" ON public.ehds_faq_data_columns FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can manage FAQ data rows" ON public.ehds_faq_data_rows FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Admin read all (including unpublished)
CREATE POLICY "Admins can read all FAQ data tables" ON public.ehds_faq_data_tables FOR SELECT TO authenticated USING (public.is_admin_or_editor(auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_ehds_faq_data_tables_updated_at BEFORE UPDATE ON public.ehds_faq_data_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
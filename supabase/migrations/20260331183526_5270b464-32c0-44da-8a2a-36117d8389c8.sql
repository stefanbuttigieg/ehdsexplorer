
-- Data tables for implementing acts (inspired by FHIR logical models)
-- Each implementing act can have multiple data tables, each with column definitions and rows

CREATE TABLE public.implementing_act_data_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implementing_act_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.implementing_act_data_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.implementing_act_data_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  column_key TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.implementing_act_data_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES public.implementing_act_data_tables(id) ON DELETE CASCADE,
  values JSONB NOT NULL DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.implementing_act_data_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_data_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementing_act_data_rows ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Public read data tables" ON public.implementing_act_data_tables FOR SELECT USING (true);
CREATE POLICY "Public read data columns" ON public.implementing_act_data_columns FOR SELECT USING (true);
CREATE POLICY "Public read data rows" ON public.implementing_act_data_rows FOR SELECT USING (true);

-- Admin write
CREATE POLICY "Admin write data tables" ON public.implementing_act_data_tables FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin write data columns" ON public.implementing_act_data_columns FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Admin write data rows" ON public.implementing_act_data_rows FOR ALL TO authenticated USING (public.is_admin_or_editor(auth.uid())) WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_data_tables_updated_at BEFORE UPDATE ON public.implementing_act_data_tables FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_data_rows_updated_at BEFORE UPDATE ON public.implementing_act_data_rows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

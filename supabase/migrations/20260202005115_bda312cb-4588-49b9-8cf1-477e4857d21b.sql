-- Create table for eHDSI KPI data staging (pending admin review)
CREATE TABLE public.ehdsi_kpi_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL DEFAULT 'primary_use',
  value NUMERIC,
  unit TEXT,
  reference_date DATE,
  raw_data JSONB,
  source_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for approved eHDSI KPI data (published)
CREATE TABLE public.ehdsi_kpi_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  kpi_id TEXT NOT NULL,
  kpi_name TEXT NOT NULL,
  kpi_category TEXT NOT NULL DEFAULT 'primary_use',
  value NUMERIC,
  unit TEXT,
  reference_date DATE,
  raw_data JSONB,
  source_url TEXT,
  approved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (country_code, kpi_id, reference_date)
);

-- Create table for sync job history
CREATE TABLE public.ehdsi_sync_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  records_fetched INTEGER DEFAULT 0,
  records_new INTEGER DEFAULT 0,
  error_message TEXT,
  triggered_by TEXT DEFAULT 'scheduled'
);

-- Enable RLS
ALTER TABLE public.ehdsi_kpi_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehdsi_kpi_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ehdsi_sync_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for staging table (admin only for write, public read for transparency)
CREATE POLICY "Anyone can read staging data"
  ON public.ehdsi_kpi_staging
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage staging data"
  ON public.ehdsi_kpi_staging
  FOR ALL
  USING (is_admin_or_editor(auth.uid()));

-- RLS policies for published KPI data (public read)
CREATE POLICY "Anyone can read published KPI data"
  ON public.ehdsi_kpi_data
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage published KPI data"
  ON public.ehdsi_kpi_data
  FOR ALL
  USING (is_admin_or_editor(auth.uid()));

-- RLS policies for sync history
CREATE POLICY "Anyone can read sync history"
  ON public.ehdsi_sync_history
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage sync history"
  ON public.ehdsi_sync_history
  FOR ALL
  USING (is_admin_or_editor(auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_ehdsi_staging_status ON public.ehdsi_kpi_staging(status);
CREATE INDEX idx_ehdsi_staging_country ON public.ehdsi_kpi_staging(country_code);
CREATE INDEX idx_ehdsi_data_country ON public.ehdsi_kpi_data(country_code);
CREATE INDEX idx_ehdsi_data_kpi ON public.ehdsi_kpi_data(kpi_id);

-- Add update triggers
CREATE TRIGGER update_ehdsi_kpi_staging_updated_at
  BEFORE UPDATE ON public.ehdsi_kpi_staging
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ehdsi_kpi_data_updated_at
  BEFORE UPDATE ON public.ehdsi_kpi_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create enum for obligation categories
CREATE TYPE public.obligation_category AS ENUM ('primary_use', 'secondary_use', 'general');

-- Create enum for obligation status
CREATE TYPE public.obligation_status AS ENUM ('not_started', 'in_progress', 'partial', 'completed');

-- Create table for EHDS obligation definitions
CREATE TABLE public.ehds_obligations (
  id text PRIMARY KEY,
  category obligation_category NOT NULL,
  name text NOT NULL,
  description text,
  article_references text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ehds_obligations ENABLE ROW LEVEL SECURITY;

-- RLS policies for obligations
CREATE POLICY "Anyone can read obligations"
  ON public.ehds_obligations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage obligations"
  ON public.ehds_obligations FOR ALL
  USING (is_admin_or_editor(auth.uid()));

-- Create table for country obligation status tracking
CREATE TABLE public.country_obligation_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  obligation_id text NOT NULL REFERENCES public.ehds_obligations(id) ON DELETE CASCADE,
  status obligation_status NOT NULL DEFAULT 'not_started',
  status_notes text,
  evidence_url text,
  last_verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(country_code, obligation_id)
);

-- Enable RLS
ALTER TABLE public.country_obligation_status ENABLE ROW LEVEL SECURITY;

-- RLS policies for country obligation status
CREATE POLICY "Anyone can read country obligation status"
  ON public.country_obligation_status FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage country obligation status"
  ON public.country_obligation_status FOR ALL
  USING (is_admin_or_editor(auth.uid()));

-- Update implementation_tracker_config to support category weights
ALTER TABLE public.implementation_tracker_config
  ADD COLUMN IF NOT EXISTS primary_use_weight numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS secondary_use_weight numeric NOT NULL DEFAULT 35,
  ADD COLUMN IF NOT EXISTS general_weight numeric NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS status_not_started_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_in_progress_value numeric NOT NULL DEFAULT 33,
  ADD COLUMN IF NOT EXISTS status_partial_value numeric NOT NULL DEFAULT 66,
  ADD COLUMN IF NOT EXISTS status_completed_value numeric NOT NULL DEFAULT 100;

-- Insert default obligations - Primary Use
INSERT INTO public.ehds_obligations (id, category, name, description, article_references, sort_order) VALUES
('ehda_services', 'primary_use', 'Electronic Health Data Access Services', 'Establish electronic health data access services at national, regional, or local levels for natural persons to access their personal electronic health data.', ARRAY['Article 4'], 1),
('hp_access_services', 'primary_use', 'Health Professional Access Services', 'Ensure health professionals can access priority categories of personal electronic health data of individuals under their treatment.', ARRAY['Article 12'], 2),
('ehr_registration', 'primary_use', 'Registration of Personal Electronic Health Data', 'Ensure healthcare providers register relevant personal electronic health data in an electronic format within an EHR system.', ARRAY['Article 13', 'Article 14'], 3),
('digital_health_authority', 'primary_use', 'Digital Health Authorities', 'Designate digital health authorities responsible for national implementation and enforcement.', ARRAY['Article 19'], 4),
('ncp_digital_health', 'primary_use', 'National Contact Point for Digital Health', 'Designate a national contact point for digital health for cross-border exchange via MyHealth@EU.', ARRAY['Article 23'], 5),
('training_literacy', 'primary_use', 'Training and Digital Health Literacy', 'Develop training programmes for health professionals and promote digital health literacy for patients.', ARRAY['Article 83', 'Article 84'], 6),
('primary_storage', 'primary_use', 'Storage of Personal Electronic Health Data', 'Ensure high level of protection and security for personal electronic health data processed for primary use.', ARRAY['Article 86'], 7);

-- Insert default obligations - Secondary Use
INSERT INTO public.ehds_obligations (id, category, name, description, article_references, sort_order) VALUES
('hdab', 'secondary_use', 'Health Data Access Bodies', 'Designate health data access bodies responsible for managing access to electronic health data for secondary use.', ARRAY['Article 55'], 1),
('ncp_secondary', 'secondary_use', 'National Contact Point for Secondary Use', 'Designate a national contact point for secondary use via HealthData@EU.', ARRAY['Article 75'], 2),
('secure_processing', 'secondary_use', 'Secure Processing Environments', 'Provide access to electronic health data for secondary use only through secure processing environments.', ARRAY['Article 73'], 3),
('opt_out', 'secondary_use', 'Opt-out Mechanism', 'Provide an accessible mechanism for natural persons to opt out from secondary use processing.', ARRAY['Article 71'], 4),
('trusted_holders', 'secondary_use', 'Trusted Health Data Holders', 'May establish a procedure for designating trusted health data holders with simplified access procedures.', ARRAY['Article 72'], 5),
('secondary_storage', 'secondary_use', 'Storage for Secondary Use', 'Store and process personal electronic health data within the Union for secondary use operations.', ARRAY['Article 87'], 6);

-- Insert default obligations - General
INSERT INTO public.ehds_obligations (id, category, name, description, article_references, sort_order) VALUES
('penalties', 'general', 'Penalties', 'Lay down rules on penalties for infringements of the Regulation, making them effective, proportionate, and dissuasive.', ARRAY['Article 99'], 1),
('procurement_funding', 'general', 'Public Procurement and Funding', 'Reference applicable technical specifications and standards from the Regulation in public procurement procedures.', ARRAY['Article 85'], 2);

-- Create updated_at trigger for new tables
CREATE TRIGGER update_ehds_obligations_updated_at
  BEFORE UPDATE ON public.ehds_obligations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_country_obligation_status_updated_at
  BEFORE UPDATE ON public.country_obligation_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
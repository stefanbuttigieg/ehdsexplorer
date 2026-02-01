-- Landing Page Content Management Tables
-- Manages stakeholder-specific content for Citizens, Health Tech, and Healthcare Professional pages

-- Citizen Rights table
CREATE TABLE public.citizen_rights (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  article_numbers INTEGER[] NOT NULL DEFAULT '{}',
  icon TEXT NOT NULL DEFAULT 'FileText',
  category TEXT NOT NULL CHECK (category IN ('access', 'control', 'protection', 'cross-border')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health Tech Compliance Categories table
CREATE TABLE public.healthtech_compliance_categories (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Server',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Health Tech Compliance Items table
CREATE TABLE public.healthtech_compliance_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES public.healthtech_compliance_categories(id) ON DELETE CASCADE,
  requirement TEXT NOT NULL,
  description TEXT NOT NULL,
  article_references INTEGER[] NOT NULL DEFAULT '{}',
  evidence_hint TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium')) DEFAULT 'medium',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Healthcare Workflows table
CREATE TABLE public.healthcare_workflows (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'FileText',
  scenario TEXT NOT NULL,
  key_takeaway TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Healthcare Workflow Steps table
CREATE TABLE public.healthcare_workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL REFERENCES public.healthcare_workflows(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  action TEXT NOT NULL,
  ehds_reference TEXT NOT NULL,
  article_numbers INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, step_number)
);

-- Healthcare Patient Rights table
CREATE TABLE public.healthcare_patient_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  right_name TEXT NOT NULL,
  description TEXT NOT NULL,
  article_number INTEGER NOT NULL,
  practical_implication TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.citizen_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthtech_compliance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthtech_compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_patient_rights ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can read citizen rights" ON public.citizen_rights FOR SELECT USING (true);
CREATE POLICY "Anyone can read healthtech categories" ON public.healthtech_compliance_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read healthtech items" ON public.healthtech_compliance_items FOR SELECT USING (true);
CREATE POLICY "Anyone can read healthcare workflows" ON public.healthcare_workflows FOR SELECT USING (true);
CREATE POLICY "Anyone can read workflow steps" ON public.healthcare_workflow_steps FOR SELECT USING (true);
CREATE POLICY "Anyone can read patient rights" ON public.healthcare_patient_rights FOR SELECT USING (true);

-- Admin write policies for citizen_rights
CREATE POLICY "Admins can insert citizen rights" ON public.citizen_rights FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update citizen rights" ON public.citizen_rights FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete citizen rights" ON public.citizen_rights FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Admin write policies for healthtech_compliance_categories
CREATE POLICY "Admins can insert healthtech categories" ON public.healthtech_compliance_categories FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update healthtech categories" ON public.healthtech_compliance_categories FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete healthtech categories" ON public.healthtech_compliance_categories FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Admin write policies for healthtech_compliance_items
CREATE POLICY "Admins can insert healthtech items" ON public.healthtech_compliance_items FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update healthtech items" ON public.healthtech_compliance_items FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete healthtech items" ON public.healthtech_compliance_items FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Admin write policies for healthcare_workflows
CREATE POLICY "Admins can insert healthcare workflows" ON public.healthcare_workflows FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update healthcare workflows" ON public.healthcare_workflows FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete healthcare workflows" ON public.healthcare_workflows FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Admin write policies for healthcare_workflow_steps
CREATE POLICY "Admins can insert workflow steps" ON public.healthcare_workflow_steps FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update workflow steps" ON public.healthcare_workflow_steps FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete workflow steps" ON public.healthcare_workflow_steps FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Admin write policies for healthcare_patient_rights
CREATE POLICY "Admins can insert patient rights" ON public.healthcare_patient_rights FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can update patient rights" ON public.healthcare_patient_rights FOR UPDATE USING (is_admin_or_editor(auth.uid()));
CREATE POLICY "Admins can delete patient rights" ON public.healthcare_patient_rights FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Update triggers
CREATE TRIGGER update_citizen_rights_updated_at BEFORE UPDATE ON public.citizen_rights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_healthtech_categories_updated_at BEFORE UPDATE ON public.healthtech_compliance_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_healthtech_items_updated_at BEFORE UPDATE ON public.healthtech_compliance_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_healthcare_workflows_updated_at BEFORE UPDATE ON public.healthcare_workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON public.healthcare_workflow_steps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patient_rights_updated_at BEFORE UPDATE ON public.healthcare_patient_rights FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
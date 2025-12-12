-- Create page_content table for managing static page content like Overview
CREATE TABLE public.page_content (
  id text PRIMARY KEY,
  title text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read page content" ON public.page_content
FOR SELECT USING (true);

CREATE POLICY "Admins can insert page content" ON public.page_content
FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update page content" ON public.page_content
FOR UPDATE USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete page content" ON public.page_content
FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_page_content_updated_at
  BEFORE UPDATE ON public.page_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial overview page content
INSERT INTO public.page_content (id, title, content) VALUES (
  'overview',
  'European Health Data Space Regulation',
  '{
    "subtitle": "Quick overview of the EHDS Regulation",
    "regulation_reference": "Regulation (EU) 2025/327",
    "what_is_ehds": {
      "title": "What is the EHDS?",
      "intro": "The European Health Data Space (EHDS) is a health-specific ecosystem comprising rules, common standards and practices, infrastructures and a governance framework that aims to:",
      "points": [
        {"title": "Empower individuals", "description": "through increased digital access to and control of their electronic health data"},
        {"title": "Support healthcare delivery", "description": "by enabling health data to flow freely with the patient across borders"},
        {"title": "Foster a genuine single market", "description": "for electronic health record systems and related services"},
        {"title": "Provide a framework for secondary use", "description": "of health data for research, innovation, policy-making, and regulatory purposes"}
      ]
    },
    "key_components": {
      "title": "Key Components",
      "items": [
        {"title": "Primary Use (Chapter II)", "description": "Rights of individuals to access, download, and share their health data. Includes MyHealth@EU for cross-border healthcare."},
        {"title": "EHR Systems (Chapter III)", "description": "Requirements for electronic health record systems, including CE marking and interoperability standards."},
        {"title": "Secondary Use (Chapter IV)", "description": "Framework for accessing health data for research, innovation, and policy-making through health data access bodies."},
        {"title": "Cross-Border Infrastructure (Chapters II & VI)", "description": "MyHealth@EU for primary use and HealthData@EU for secondary use of health data across borders."}
      ]
    },
    "key_dates": {
      "title": "Key Dates",
      "dates": [
        {"label": "Entry into force", "date": "25 March 2025"},
        {"label": "General application", "date": "26 March 2027"},
        {"label": "MyHealth@EU (Art. 23)", "date": "26 March 2028"},
        {"label": "EHR Systems & HealthData@EU", "date": "26 March 2029"}
      ]
    }
  }'::jsonb
);
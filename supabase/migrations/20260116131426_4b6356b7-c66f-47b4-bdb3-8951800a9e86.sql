-- Create country_legislation table for tracking national EHDS-linked legislation
CREATE TABLE public.country_legislation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Country Information
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  
  -- Legislation Details
  title TEXT NOT NULL,
  official_title TEXT,
  url TEXT,
  language TEXT DEFAULT 'en',
  summary TEXT,
  
  -- Dates for status progression
  draft_date DATE,
  tabled_date DATE,
  adoption_date DATE,
  publication_date DATE,
  effective_date DATE,
  
  -- EHDS Linkages
  ehds_articles_referenced INTEGER[] DEFAULT '{}',
  implementing_act_ids TEXT[] DEFAULT '{}',
  
  -- Classification
  legislation_type TEXT DEFAULT 'transposition' 
    CHECK (legislation_type IN ('transposition', 'related', 'amendment', 'preparatory')),
  
  -- Enhanced Status Tracking
  status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'tabled', 'under_review', 'adopted', 'published', 'in_force', 'superseded')),
  status_notes TEXT,
  
  -- Enforcement Measures
  enforcement_measures TEXT[] DEFAULT '{}',
  enforcement_details JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_country_legislation_country ON public.country_legislation(country_code);
CREATE INDEX idx_country_legislation_status ON public.country_legislation(status);
CREATE INDEX idx_country_legislation_articles ON public.country_legislation USING GIN(ehds_articles_referenced);
CREATE INDEX idx_country_legislation_enforcement ON public.country_legislation USING GIN(enforcement_measures);
CREATE INDEX idx_country_legislation_type ON public.country_legislation(legislation_type);

-- Enable RLS
ALTER TABLE public.country_legislation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read country legislation"
  ON public.country_legislation
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert country legislation"
  ON public.country_legislation
  FOR INSERT
  WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update country legislation"
  ON public.country_legislation
  FOR UPDATE
  USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete country legislation"
  ON public.country_legislation
  FOR DELETE
  USING (is_admin_or_editor(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_country_legislation_updated_at
  BEFORE UPDATE ON public.country_legislation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
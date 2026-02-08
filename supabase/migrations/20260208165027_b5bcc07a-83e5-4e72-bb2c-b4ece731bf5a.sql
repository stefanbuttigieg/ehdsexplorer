
-- Toolkit Questions: The Q&A wizard steps
CREATE TABLE public.toolkit_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL DEFAULT 'single_choice', -- single_choice, multi_choice, scale
  options JSONB NOT NULL DEFAULT '[]', -- [{value, label, description, icon}]
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  category TEXT NOT NULL DEFAULT 'starter_kit', -- starter_kit, readiness
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Toolkit Profiles: Stores user wizard responses & results
CREATE TABLE public.toolkit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT, -- for anonymous users
  answers JSONB NOT NULL DEFAULT '{}', -- {question_id: answer_value}
  profile_type TEXT, -- derived: ehr_manufacturer, researcher, etc.
  organization_size TEXT, -- startup, sme, large
  ai_summary TEXT, -- AI-generated personalized summary
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Toolkit Recommendations: Rule-based mapping of profile → resources
CREATE TABLE public.toolkit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_type TEXT NOT NULL,
  organization_size TEXT, -- null = applies to all sizes
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'checklist', -- checklist, article_group, scenario, guide, external
  resource_reference TEXT, -- internal ID or URL
  priority INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Readiness Questions: Self-assessment questionnaire
CREATE TABLE public.readiness_questions (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- e.g. data_governance, technical, organizational
  weight NUMERIC NOT NULL DEFAULT 1.0,
  options JSONB NOT NULL DEFAULT '[]', -- [{value, label, score}]
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Readiness Assessments: Stores user assessment results
CREATE TABLE public.readiness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id TEXT,
  answers JSONB NOT NULL DEFAULT '{}',
  scores JSONB NOT NULL DEFAULT '{}', -- {category: score}
  total_score NUMERIC,
  max_score NUMERIC,
  ai_gap_analysis TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.toolkit_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolkit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toolkit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Toolkit Questions: publicly readable (content), admin-managed
CREATE POLICY "Anyone can read active toolkit questions"
  ON public.toolkit_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage toolkit questions"
  ON public.toolkit_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Toolkit Profiles: users can manage their own
CREATE POLICY "Users can read own toolkit profiles"
  ON public.toolkit_profiles FOR SELECT
  USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "Anyone can create toolkit profiles"
  ON public.toolkit_profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own toolkit profiles"
  ON public.toolkit_profiles FOR UPDATE
  USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

-- Toolkit Recommendations: publicly readable, admin-managed
CREATE POLICY "Anyone can read active recommendations"
  ON public.toolkit_recommendations FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage recommendations"
  ON public.toolkit_recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Readiness Questions: publicly readable, admin-managed
CREATE POLICY "Anyone can read active readiness questions"
  ON public.readiness_questions FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage readiness questions"
  ON public.readiness_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('super_admin', 'admin')
    )
  );

-- Readiness Assessments: users can manage their own
CREATE POLICY "Users can read own assessments"
  ON public.readiness_assessments FOR SELECT
  USING (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "Anyone can create assessments"
  ON public.readiness_assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own assessments"
  ON public.readiness_assessments FOR UPDATE
  USING (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

-- Updated_at triggers
CREATE TRIGGER update_toolkit_questions_updated_at
  BEFORE UPDATE ON public.toolkit_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_toolkit_profiles_updated_at
  BEFORE UPDATE ON public.toolkit_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_toolkit_recommendations_updated_at
  BEFORE UPDATE ON public.toolkit_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_readiness_questions_updated_at
  BEFORE UPDATE ON public.readiness_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_readiness_assessments_updated_at
  BEFORE UPDATE ON public.readiness_assessments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

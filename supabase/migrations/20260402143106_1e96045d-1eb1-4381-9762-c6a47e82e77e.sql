-- Fix: Grant permissions on ai_assistant_feedback for anon and authenticated
GRANT SELECT, INSERT ON public.ai_assistant_feedback TO anon;
GRANT SELECT, INSERT ON public.ai_assistant_feedback TO authenticated;

-- AI Prompt Configuration table
CREATE TABLE public.ai_prompt_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_key TEXT NOT NULL UNIQUE,
  prompt_label TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'role',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_prompt_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active prompts"
  ON public.ai_prompt_config FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage prompts"
  ON public.ai_prompt_config FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

GRANT SELECT ON public.ai_prompt_config TO anon;
GRANT SELECT ON public.ai_prompt_config TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.ai_prompt_config TO authenticated;

CREATE TRIGGER update_ai_prompt_config_updated_at
  BEFORE UPDATE ON public.ai_prompt_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default prompts
INSERT INTO public.ai_prompt_config (prompt_key, prompt_label, prompt_text, category, sort_order) VALUES
('system', 'System Prompt', 'You are an expert AI assistant EXCLUSIVELY for the European Health Data Space (EHDS) Regulation (EU) 2025/327. Your ONLY purpose is to help users understand and navigate this specific regulation.', 'system', 0),
('role_general', 'General User', E'USER ROLE: General User\nFocus on providing balanced, accessible explanations that cover the key points without assuming specialized knowledge. Use everyday language while maintaining accuracy. Provide practical examples when helpful.', 'role', 1),
('role_healthcare', 'Healthcare Professional', E'USER ROLE: Healthcare Professional\nFocus on clinical implications, patient rights under EHDS, and how the regulation affects healthcare delivery. Emphasize:\n- Primary use of health data (Articles 3-14)\n- Patient access rights and control mechanisms\n- EHR system requirements and interoperability\n- MyHealth@EU cross-border data exchange\n- Data quality requirements for clinical use\n- Obligations for healthcare providers and data holders\nUse medical/clinical terminology where appropriate.', 'role', 2),
('role_legal', 'Legal/Compliance Officer', E'USER ROLE: Legal/Compliance Officer\nFocus on legal obligations, compliance requirements, and regulatory framework. Emphasize:\n- Specific obligations for different actors (manufacturers, data holders, data users)\n- Penalties and enforcement mechanisms\n- Relationship with GDPR and other EU regulations\n- Data governance and accountability requirements\n- Contractual and procedural requirements\n- Timeline for compliance and transitional provisions\n- Legal basis for data processing under primary and secondary use\nCite specific articles and legal provisions precisely.', 'role', 3),
('role_researcher', 'Researcher', E'USER ROLE: Researcher\nFocus on secondary use of health data for research purposes. Emphasize:\n- Chapter IV provisions on secondary use (Articles 33-50)\n- Health data access body procedures and requirements\n- Data permit application process\n- Eligible purposes for secondary use (Article 34)\n- Data minimization and secure processing environments\n- Cross-border research collaboration through HealthData@EU\n- Publication and result sharing requirements\n- Fees and access timelines\nExplain processes in practical, actionable terms.', 'role', 4),
('role_developer', 'Health Tech Developer', E'USER ROLE: Health Tech Developer\nFocus on technical implementation requirements. Emphasize:\n- EHR system essential requirements (Article 6, Annex II)\n- EU self-declaration and conformity assessment procedures\n- Interoperability requirements and European EHR exchange format\n- API and data exchange standards\n- Certification and market surveillance\n- Cybersecurity and logging requirements\n- Wellness application voluntary labeling\n- Integration with existing health IT infrastructure\nUse technical terminology and reference specific technical annexes.', 'role', 5),
('role_policy', 'Policy Maker', E'USER ROLE: Policy Maker\nFocus on governance structures and implementation strategy. Emphasize:\n- EHDS Board composition and responsibilities\n- National digital health authority roles\n- Cross-border cooperation mechanisms (MyHealth@EU, HealthData@EU)\n- Implementation timeline and key milestones\n- Member State obligations and flexibility\n- Relationship with national health systems\n- Funding and resource requirements\n- Monitoring and evaluation frameworks\n- Delegated and implementing acts timeline\nProvide strategic, high-level perspective while connecting to specific provisions.', 'role', 6),
('level_expert', 'Expert Level', E'EXPLANATION LEVEL: Expert\nUse precise legal and technical terminology without simplification. Assume deep familiarity with EU regulatory framework, health data governance, and legal concepts. Reference specific articles, recitals, and annexes with minimal context. Focus on nuances, exceptions, and edge cases.', 'level', 1),
('level_professional', 'Professional Level', E'EXPLANATION LEVEL: Professional\nUse clear professional language with appropriate technical terms. Provide context for legal references. Balance detail with accessibility. Include practical implications alongside regulatory text. Assume working knowledge of the healthcare or legal sector.', 'level', 2),
('level_student', 'Student Level', E'EXPLANATION LEVEL: Student\nUse an educational tone that builds understanding step by step. Define technical and legal terms when first introduced. Include concrete examples to illustrate abstract concepts. Explain the "why" behind provisions, not just the "what". Connect concepts to real-world scenarios students might encounter.', 'level', 3),
('level_beginner', 'Beginner Level', E'EXPLANATION LEVEL: Complete Beginner\nUse simple, everyday language. Avoid jargon or define all terms clearly. Use analogies and relatable examples extensively. Break complex concepts into small, digestible pieces. Focus on the big picture before details. Use phrases like "In simple terms..." or "Think of it like...". Make no assumptions about prior knowledge of EU law or health data governance.', 'level', 4);

-- AI Benchmarking table
CREATE TABLE public.ai_assistant_benchmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT,
  model_used TEXT NOT NULL,
  role_used TEXT NOT NULL DEFAULT 'general',
  explain_level TEXT NOT NULL DEFAULT 'professional',
  response_time_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  user_query_preview TEXT,
  feedback_type TEXT,
  ip_address TEXT,
  error_occurred BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_assistant_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view benchmarks"
  ON public.ai_assistant_benchmarks FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Service role can insert benchmarks"
  ON public.ai_assistant_benchmarks FOR INSERT
  WITH CHECK (true);

GRANT SELECT ON public.ai_assistant_benchmarks TO authenticated;
GRANT INSERT ON public.ai_assistant_benchmarks TO anon;
GRANT INSERT ON public.ai_assistant_benchmarks TO authenticated;

CREATE INDEX idx_ai_benchmarks_created_at ON public.ai_assistant_benchmarks(created_at DESC);
CREATE INDEX idx_ai_benchmarks_model ON public.ai_assistant_benchmarks(model_used);
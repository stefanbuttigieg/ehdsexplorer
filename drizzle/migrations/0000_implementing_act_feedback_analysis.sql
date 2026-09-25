CREATE TABLE public.implementing_act_feedback (
  id bigint PRIMARY KEY,
  implementing_act_id text NOT NULL,
  publication_id bigint,
  date_feedback timestamptz,
  feedback text NOT NULL DEFAULT '',
  language text,
  user_type text,
  country text,
  organization text,
  company_size text,
  sentiment text,
  sentiment_score numeric,
  analyzed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_iaf_act ON public.implementing_act_feedback(implementing_act_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.implementing_act_feedback TO authenticated;
GRANT ALL ON public.implementing_act_feedback TO service_role;
ALTER TABLE public.implementing_act_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage act feedback" ON public.implementing_act_feedback
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TABLE public.implementing_act_feedback_analysis (
  implementing_act_id text PRIMARY KEY,
  initiative_id text,
  total_count integer NOT NULL DEFAULT 0,
  analyzed_count integer NOT NULL DEFAULT 0,
  sentiment_counts jsonb NOT NULL DEFAULT '{}'::jsonb,
  word_cloud jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_user_type jsonb NOT NULL DEFAULT '[]'::jsonb,
  by_country jsonb NOT NULL DEFAULT '[]'::jsonb,
  themes_summary text,
  key_themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary_comment_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'idle',
  last_error text,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.implementing_act_feedback_analysis TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.implementing_act_feedback_analysis TO authenticated;
GRANT ALL ON public.implementing_act_feedback_analysis TO service_role;
ALTER TABLE public.implementing_act_feedback_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read feedback analysis" ON public.implementing_act_feedback_analysis
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage feedback analysis" ON public.implementing_act_feedback_analysis
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));
CREATE TRIGGER update_iafa_updated_at BEFORE UPDATE ON public.implementing_act_feedback_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.feedback_sync_lock (
  id text PRIMARY KEY,
  locked_until timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  paused_reason text
);
GRANT ALL ON public.feedback_sync_lock TO service_role;
ALTER TABLE public.feedback_sync_lock ENABLE ROW LEVEL SECURITY;
INSERT INTO public.feedback_sync_lock(id) VALUES ('act-feedback');
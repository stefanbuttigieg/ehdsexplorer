
CREATE TABLE public.translation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_reference text UNIQUE,
  source_language text NOT NULL,
  target_language text NOT NULL,
  source_text text NOT NULL,
  translated_text text,
  target_type text NOT NULL DEFAULT 'snippet',
  target_id text,
  target_field text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_translation_jobs_external_ref ON public.translation_jobs(external_reference);
CREATE INDEX idx_translation_jobs_status ON public.translation_jobs(status);
CREATE INDEX idx_translation_jobs_target ON public.translation_jobs(target_type, target_id);
CREATE INDEX idx_translation_jobs_requested_by ON public.translation_jobs(requested_by);

ALTER TABLE public.translation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/editors can view all translation jobs"
ON public.translation_jobs FOR SELECT
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Users can view their own translation jobs"
ON public.translation_jobs FOR SELECT
TO authenticated
USING (requested_by = auth.uid());

CREATE POLICY "Authenticated users can create translation jobs"
ON public.translation_jobs FOR INSERT
TO authenticated
WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Admins/editors can update translation jobs"
ON public.translation_jobs FOR UPDATE
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins/editors can delete translation jobs"
ON public.translation_jobs FOR DELETE
TO authenticated
USING (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_translation_jobs_updated_at
BEFORE UPDATE ON public.translation_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

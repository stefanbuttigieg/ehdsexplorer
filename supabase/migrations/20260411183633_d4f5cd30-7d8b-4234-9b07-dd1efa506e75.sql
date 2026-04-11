CREATE TABLE public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  template_name text NOT NULL DEFAULT 'newsletter',
  recipient_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email logs"
  ON public.email_send_log FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));

CREATE INDEX idx_email_send_log_created ON public.email_send_log(created_at DESC);
CREATE INDEX idx_email_send_log_status ON public.email_send_log(status);
CREATE INDEX idx_email_send_log_template ON public.email_send_log(template_name);
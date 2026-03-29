
CREATE TABLE public.translation_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'error',
  articles_count INTEGER DEFAULT 0,
  recitals_count INTEGER DEFAULT 0,
  definitions_count INTEGER DEFAULT 0,
  annexes_count INTEGER DEFAULT 0,
  footnotes_count INTEGER DEFAULT 0,
  error_message TEXT,
  source_url TEXT,
  content_length INTEGER DEFAULT 0,
  parser_detected_language TEXT,
  import_type TEXT DEFAULT 'batch',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.translation_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage import logs"
ON public.translation_import_logs
FOR ALL
TO authenticated
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));

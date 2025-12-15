-- Create footnotes table
CREATE TABLE public.footnotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  marker text NOT NULL,
  content text NOT NULL,
  article_id integer REFERENCES public.articles(id) ON DELETE CASCADE,
  recital_id integer REFERENCES public.recitals(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT footnote_must_have_parent CHECK (
    (article_id IS NOT NULL AND recital_id IS NULL) OR
    (article_id IS NULL AND recital_id IS NOT NULL)
  )
);

-- Create index for faster lookups
CREATE INDEX idx_footnotes_article_id ON public.footnotes(article_id);
CREATE INDEX idx_footnotes_recital_id ON public.footnotes(recital_id);

-- Enable RLS
ALTER TABLE public.footnotes ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read footnotes"
ON public.footnotes
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert footnotes"
ON public.footnotes
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update footnotes"
ON public.footnotes
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete footnotes"
ON public.footnotes
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_footnotes_updated_at
BEFORE UPDATE ON public.footnotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
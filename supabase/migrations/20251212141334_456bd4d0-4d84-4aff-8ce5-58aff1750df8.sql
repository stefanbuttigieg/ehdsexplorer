-- Create published_works table
CREATE TABLE public.published_works (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  link text NOT NULL,
  affiliated_organization text NOT NULL,
  related_articles integer[] DEFAULT '{}'::integer[],
  related_implementing_acts text[] DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.published_works ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can read published_works"
ON public.published_works
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert published_works"
ON public.published_works
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update published_works"
ON public.published_works
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete published_works"
ON public.published_works
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_published_works_updated_at
BEFORE UPDATE ON public.published_works
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
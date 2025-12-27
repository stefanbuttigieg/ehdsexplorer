-- Create plain language translations table
CREATE TABLE public.plain_language_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'recital')),
  content_id INTEGER NOT NULL,
  plain_language_text TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  generated_by TEXT NOT NULL DEFAULT 'ai' CHECK (generated_by IN ('ai', 'manual')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_type, content_id)
);

-- Enable Row Level Security
ALTER TABLE public.plain_language_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read published translations"
ON public.plain_language_translations
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can read all translations"
ON public.plain_language_translations
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can insert translations"
ON public.plain_language_translations
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update translations"
ON public.plain_language_translations
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete translations"
ON public.plain_language_translations
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_plain_language_translations_updated_at
BEFORE UPDATE ON public.plain_language_translations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_plain_language_translations_content 
ON public.plain_language_translations(content_type, content_id);

CREATE INDEX idx_plain_language_translations_published 
ON public.plain_language_translations(is_published) WHERE is_published = true;
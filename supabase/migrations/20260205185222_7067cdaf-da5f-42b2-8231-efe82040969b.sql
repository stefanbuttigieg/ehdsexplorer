-- Create footnote_translations table for multi-language footnote support
CREATE TABLE public.footnote_translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  footnote_id UUID NOT NULL REFERENCES public.footnotes(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL REFERENCES public.languages(code) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT false,
  translated_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(footnote_id, language_code)
);

-- Enable RLS
ALTER TABLE public.footnote_translations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can read footnote translations"
  ON public.footnote_translations
  FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage footnote translations"
  ON public.footnote_translations
  FOR ALL
  USING (public.is_admin_or_editor(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_footnote_translations_updated_at
  BEFORE UPDATE ON public.footnote_translations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_footnote_translations_language ON public.footnote_translations(language_code);
CREATE INDEX idx_footnote_translations_footnote ON public.footnote_translations(footnote_id);
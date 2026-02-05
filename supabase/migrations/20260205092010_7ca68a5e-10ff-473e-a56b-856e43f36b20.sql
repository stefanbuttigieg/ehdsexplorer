-- Create table to store parsing patterns that work
CREATE TABLE public.parsing_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'html', 'text')),
  source_url TEXT,
  article_pattern TEXT,
  recital_pattern TEXT,
  chapter_pattern TEXT,
  annex_pattern TEXT,
  adoption_marker TEXT,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create table to log import history
CREATE TABLE public.translation_import_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  language_code TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'html', 'text')),
  source_url TEXT,
  pattern_id UUID REFERENCES public.parsing_patterns(id),
  articles_parsed INTEGER NOT NULL DEFAULT 0,
  recitals_parsed INTEGER NOT NULL DEFAULT 0,
  definitions_parsed INTEGER NOT NULL DEFAULT 0,
  annexes_parsed INTEGER NOT NULL DEFAULT 0,
  footnotes_parsed INTEGER NOT NULL DEFAULT 0,
  articles_imported INTEGER NOT NULL DEFAULT 0,
  recitals_imported INTEGER NOT NULL DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.parsing_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translation_import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - editors can read and write patterns
CREATE POLICY "Editors can read parsing patterns"
  ON public.parsing_patterns
  FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Editors can insert parsing patterns"
  ON public.parsing_patterns
  FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Editors can update parsing patterns"
  ON public.parsing_patterns
  FOR UPDATE
  USING (public.is_admin_or_editor(auth.uid()));

-- RLS for import history
CREATE POLICY "Editors can read import history"
  ON public.translation_import_history
  FOR SELECT
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Editors can insert import history"
  ON public.translation_import_history
  FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_parsing_patterns_updated_at
  BEFORE UPDATE ON public.parsing_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
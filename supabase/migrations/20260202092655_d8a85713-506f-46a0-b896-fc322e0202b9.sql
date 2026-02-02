-- Create definition_sources table to store source-specific texts
CREATE TABLE public.definition_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  definition_id INTEGER NOT NULL REFERENCES public.definitions(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ehds_regulation', 'eu_ehr_glossary', 'xt_ehr')),
  source_text TEXT NOT NULL,
  source_article INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(definition_id, source)
);

-- Enable RLS
ALTER TABLE public.definition_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read definition sources"
ON public.definition_sources FOR SELECT
USING (true);

CREATE POLICY "Admins can insert definition sources"
ON public.definition_sources FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update definition sources"
ON public.definition_sources FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete definition sources"
ON public.definition_sources FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Migrate existing data: copy current source and definition to definition_sources
INSERT INTO public.definition_sources (definition_id, source, source_text, source_article)
SELECT 
  id,
  COALESCE(source, 'ehds_regulation'),
  definition,
  source_article
FROM public.definitions
WHERE definition IS NOT NULL AND definition != '';

-- Add trigger for updated_at
CREATE TRIGGER update_definition_sources_updated_at
BEFORE UPDATE ON public.definition_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
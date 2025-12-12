-- Create chapters table
CREATE TABLE public.chapters (
    id SERIAL PRIMARY KEY,
    chapter_number INTEGER NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sections table
CREATE TABLE public.sections (
    id SERIAL PRIMARY KEY,
    chapter_id INTEGER NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
    section_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(chapter_id, section_number)
);

-- Add section_id column to articles
ALTER TABLE public.articles ADD COLUMN section_id INTEGER REFERENCES public.sections(id) ON DELETE SET NULL;

-- Enable RLS on chapters
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chapters" ON public.chapters
FOR SELECT USING (true);

CREATE POLICY "Admins can insert chapters" ON public.chapters
FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update chapters" ON public.chapters
FOR UPDATE USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete chapters" ON public.chapters
FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Enable RLS on sections
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sections" ON public.sections
FOR SELECT USING (true);

CREATE POLICY "Admins can insert sections" ON public.sections
FOR INSERT WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update sections" ON public.sections
FOR UPDATE USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete sections" ON public.sections
FOR DELETE USING (is_admin_or_editor(auth.uid()));

-- Create updated_at triggers
CREATE TRIGGER update_chapters_updated_at
BEFORE UPDATE ON public.chapters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
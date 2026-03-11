
-- First remove duplicates, keeping only the latest entry per title
DELETE FROM public.comitology_updates a
USING public.comitology_updates b
WHERE a.id < b.id AND a.title = b.title;

-- Add unique constraint on title to prevent future duplicates
ALTER TABLE public.comitology_updates ADD CONSTRAINT comitology_updates_title_unique UNIQUE (title);

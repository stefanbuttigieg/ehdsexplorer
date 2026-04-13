ALTER TABLE public.definition_sources
ADD COLUMN implementing_act_id TEXT REFERENCES public.implementing_acts(id) ON DELETE SET NULL;
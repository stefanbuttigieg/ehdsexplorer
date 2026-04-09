
-- Create table to track changes from feedback period to adoption
CREATE TABLE public.implementing_act_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  implementing_act_id TEXT NOT NULL REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL DEFAULT 'modification',
  section_reference TEXT,
  original_text TEXT,
  revised_text TEXT,
  summary TEXT NOT NULL,
  is_significant BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.implementing_act_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view implementing act changes"
  ON public.implementing_act_changes FOR SELECT
  USING (true);

CREATE POLICY "Admins and editors can manage implementing act changes"
  ON public.implementing_act_changes FOR ALL
  TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE TRIGGER update_implementing_act_changes_updated_at
  BEFORE UPDATE ON public.implementing_act_changes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_implementing_act_changes_act_id 
  ON public.implementing_act_changes(implementing_act_id);

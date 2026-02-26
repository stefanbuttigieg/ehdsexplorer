
-- Fix: split the ALL policy into specific operations to avoid the linter warning
DROP POLICY "Only admins can manage comitology updates" ON public.comitology_updates;

CREATE POLICY "Admins can insert comitology updates"
  ON public.comitology_updates FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update comitology updates"
  ON public.comitology_updates FOR UPDATE
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete comitology updates"
  ON public.comitology_updates FOR DELETE
  USING (public.is_admin_or_editor(auth.uid()));

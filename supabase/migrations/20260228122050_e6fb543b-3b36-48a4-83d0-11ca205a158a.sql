
-- Fix: drop the overly broad ALL policy and create specific write policies
DROP POLICY "Admins can manage disclaimers" ON public.site_disclaimers;

CREATE POLICY "Admins can insert disclaimers"
  ON public.site_disclaimers FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update disclaimers"
  ON public.site_disclaimers FOR UPDATE
  USING (public.is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete disclaimers"
  ON public.site_disclaimers FOR DELETE
  USING (public.is_admin_or_editor(auth.uid()));

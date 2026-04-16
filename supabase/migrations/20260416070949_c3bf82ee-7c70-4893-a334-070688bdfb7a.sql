DROP POLICY "Admins can update implementing_acts" ON public.implementing_acts;

CREATE POLICY "Admins can update implementing_acts"
ON public.implementing_acts
FOR UPDATE
USING (public.is_admin_or_editor(auth.uid()))
WITH CHECK (public.is_admin_or_editor(auth.uid()));
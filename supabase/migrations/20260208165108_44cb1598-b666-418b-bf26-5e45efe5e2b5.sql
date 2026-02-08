
-- Tighten INSERT policies to require either auth or session_id
DROP POLICY "Anyone can create toolkit profiles" ON public.toolkit_profiles;
CREATE POLICY "Authenticated or session users can create toolkit profiles"
  ON public.toolkit_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

DROP POLICY "Anyone can create assessments" ON public.readiness_assessments;
CREATE POLICY "Authenticated or session users can create assessments"
  ON public.readiness_assessments FOR INSERT
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND session_id IS NOT NULL));

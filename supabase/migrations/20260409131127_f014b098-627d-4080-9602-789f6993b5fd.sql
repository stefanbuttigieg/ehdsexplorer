
-- Fix 1: readiness_assessments SELECT policy
DROP POLICY IF EXISTS "Users can read own assessments" ON public.readiness_assessments;
CREATE POLICY "Users can read own assessments"
ON public.readiness_assessments
FOR SELECT
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL)
);

-- Fix 2: toolkit_profiles SELECT policy
DROP POLICY IF EXISTS "Users can read own toolkit profiles" ON public.toolkit_profiles;
CREATE POLICY "Users can read own toolkit profiles"
ON public.toolkit_profiles
FOR SELECT
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL)
);

-- Fix 3: toolkit_profiles UPDATE policy (also had the broad check)
DROP POLICY IF EXISTS "Users can update own toolkit profiles" ON public.toolkit_profiles;
CREATE POLICY "Users can update own toolkit profiles"
ON public.toolkit_profiles
FOR UPDATE
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL)
);

-- Fix 4: readiness_assessments UPDATE policy
DROP POLICY IF EXISTS "Users can update own assessments" ON public.readiness_assessments;
CREATE POLICY "Users can update own assessments"
ON public.readiness_assessments
FOR UPDATE
USING (
  (user_id = auth.uid())
  OR (user_id IS NULL AND session_id IS NOT NULL AND auth.uid() IS NULL)
);

-- Fix 5: obligation-evidence storage SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view obligation evidence files" ON storage.objects;
CREATE POLICY "Country managers can view their own evidence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'obligation-evidence'
  AND (
    (storage.foldername(name))[1] IN (
      SELECT country_code FROM public.user_country_assignments WHERE user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  )
);

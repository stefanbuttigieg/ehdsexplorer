
DROP POLICY "Service role can insert eu_regulation_updates" ON public.eu_regulation_updates;

-- Service role uses supabaseServiceClient which bypasses RLS entirely,
-- so this permissive policy is not needed. Service role already bypasses RLS.

DROP POLICY IF EXISTS "Anyone can read sync history" ON public.ehdsi_sync_history;
DROP POLICY IF EXISTS "Anyone can read staging data" ON public.ehdsi_kpi_staging;
DROP POLICY IF EXISTS "Anyone can read active prompts" ON public.ai_prompt_config;
DROP POLICY IF EXISTS "Authenticated users can insert benchmarks" ON public.ai_assistant_benchmarks;

DROP POLICY IF EXISTS "Authenticated users can insert feedback" ON public.ai_assistant_feedback;
CREATE POLICY "Users can insert their own feedback" ON public.ai_assistant_feedback
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON public.plain_language_feedback;

DROP POLICY IF EXISTS "Public can read anonymized leaderboard columns" ON public.leaderboard_contributions;
ALTER VIEW public.leaderboard_contributions_public SET (security_invoker = off);
GRANT SELECT ON public.leaderboard_contributions_public TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can upload temp PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete temp PDFs" ON storage.objects;
CREATE POLICY "Editors can upload temp PDFs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'temp-pdf-imports' AND public.is_admin_or_editor(auth.uid()));
CREATE POLICY "Editors can delete own temp PDFs" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'temp-pdf-imports' AND owner_id = (select auth.uid()::text) AND public.is_admin_or_editor(auth.uid()));
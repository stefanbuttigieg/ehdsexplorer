
-- =============================================
-- 1. FIX: Team membership INSERT policy bug (privilege escalation)
-- =============================================
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.team_memberships;

CREATE POLICY "Owners and admins can add members"
ON public.team_memberships
FOR INSERT
WITH CHECK (
  has_team_role(auth.uid(), team_id, ARRAY['owner'::team_role, 'admin'::team_role])
);

-- =============================================
-- 2. FIX: Security Definer Views → Security Invoker
-- =============================================
-- Recreate leaderboard_contributions_public as SECURITY INVOKER
DROP VIEW IF EXISTS public.leaderboard_contributions_public;
CREATE VIEW public.leaderboard_contributions_public
WITH (security_invoker = true)
AS
SELECT id,
    md5(COALESCE((user_id)::text, session_id, 'anon'::text)) AS contributor_hash,
    country_code,
    country_name,
    category,
    points,
    source_detail,
    created_at
FROM public.leaderboard_contributions;

-- Recreate site_settings_public as SECURITY INVOKER
DROP VIEW IF EXISTS public.site_settings_public;
CREATE VIEW public.site_settings_public
WITH (security_invoker = true)
AS
SELECT id,
    maintenance_mode,
    maintenance_message,
    ai_model,
    updated_at,
    updated_by
FROM public.site_settings;

-- Grant access to views
GRANT SELECT ON public.leaderboard_contributions_public TO anon, authenticated;
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

-- =============================================
-- 3. FIX: Overly permissive INSERT policies
-- =============================================

-- ai_assistant_benchmarks: restrict to authenticated
DROP POLICY IF EXISTS "Service role can insert benchmarks" ON public.ai_assistant_benchmarks;
CREATE POLICY "Authenticated users can insert benchmarks"
ON public.ai_assistant_benchmarks
FOR INSERT TO authenticated
WITH CHECK (true);

-- ai_assistant_feedback: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.ai_assistant_feedback;
CREATE POLICY "Authenticated users can insert feedback"
ON public.ai_assistant_feedback
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- plain_language_feedback: restrict to authenticated
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.plain_language_feedback;
CREATE POLICY "Authenticated users can submit feedback"
ON public.plain_language_feedback
FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- leaderboard_contributions: restrict to admin/editor (service-inserted)
DROP POLICY IF EXISTS "Service role can insert leaderboard entries" ON public.leaderboard_contributions;
CREATE POLICY "Admin or editor can insert leaderboard entries"
ON public.leaderboard_contributions
FOR INSERT TO authenticated
WITH CHECK (is_admin_or_editor(auth.uid()));

-- =============================================
-- 4. FIX: EHDS FAQ tables open ALL policies
-- =============================================

-- ehds_faqs
DROP POLICY IF EXISTS "Service role manages FAQs" ON public.ehds_faqs;
CREATE POLICY "Admin or editor can manage FAQs"
ON public.ehds_faqs
FOR ALL TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

-- ehds_faq_footnotes
DROP POLICY IF EXISTS "Service role manages footnotes" ON public.ehds_faq_footnotes;
CREATE POLICY "Admin or editor can manage footnotes"
ON public.ehds_faq_footnotes
FOR ALL TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

-- ehds_faq_sync_log
DROP POLICY IF EXISTS "Service role manages sync log" ON public.ehds_faq_sync_log;
CREATE POLICY "Admin or editor can manage sync log"
ON public.ehds_faq_sync_log
FOR ALL TO authenticated
USING (is_admin_or_editor(auth.uid()))
WITH CHECK (is_admin_or_editor(auth.uid()));

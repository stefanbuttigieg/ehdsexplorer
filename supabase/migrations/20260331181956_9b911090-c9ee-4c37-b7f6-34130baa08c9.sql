
-- Drop overly permissive policies
DROP POLICY IF EXISTS "Service role full access FAQs" ON public.ehds_faqs;
DROP POLICY IF EXISTS "Service role full access footnotes" ON public.ehds_faq_footnotes;
DROP POLICY IF EXISTS "Service role full access sync log" ON public.ehds_faq_sync_log;

-- Recreate with proper service_role targeting
CREATE POLICY "Service role manages FAQs"
  ON public.ehds_faqs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages footnotes"
  ON public.ehds_faq_footnotes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role manages sync log"
  ON public.ehds_faq_sync_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

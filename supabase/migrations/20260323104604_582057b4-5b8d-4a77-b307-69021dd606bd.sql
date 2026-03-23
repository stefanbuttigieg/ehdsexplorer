
-- Create a public view that anonymizes user/session identifiers
-- by replacing them with a hash, preserving uniqueness for counting
CREATE OR REPLACE VIEW public.leaderboard_contributions_public AS
SELECT
  id,
  md5(COALESCE(user_id::text, session_id, 'anon')) AS contributor_hash,
  country_code,
  country_name,
  category,
  points,
  source_detail,
  created_at
FROM public.leaderboard_contributions;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_contributions_public TO anon, authenticated;

-- Revoke direct public read on the base table
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_contributions;

-- Re-create a restricted SELECT policy: only service_role can read the base table
CREATE POLICY "Only service role can read leaderboard base table"
  ON public.leaderboard_contributions
  FOR SELECT
  TO service_role
  USING (true);

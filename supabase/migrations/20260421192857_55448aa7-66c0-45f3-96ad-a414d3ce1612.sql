-- Recreate the public leaderboard view as a SECURITY DEFINER (security_invoker=off) view
-- so anonymous visitors can read aggregated leaderboard data while the underlying
-- leaderboard_contributions table remains locked down (it contains user_id/session_id).
DROP VIEW IF EXISTS public.leaderboard_contributions_public;

CREATE VIEW public.leaderboard_contributions_public
WITH (security_invoker=off) AS
SELECT
  id,
  -- Stable anonymous contributor hash (never exposes user_id or session_id)
  md5(coalesce(user_id::text, session_id::text, id::text)) AS contributor_hash,
  country_code,
  country_name,
  category,
  points,
  source_detail,
  created_at
FROM public.leaderboard_contributions;

GRANT SELECT ON public.leaderboard_contributions_public TO anon, authenticated;
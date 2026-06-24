-- Add a real anonymized contributor hash column so the public view no longer
-- needs SECURITY DEFINER to hide user_id / session_id.
ALTER TABLE public.leaderboard_contributions
  ADD COLUMN IF NOT EXISTS contributor_hash text;

-- Backfill existing rows
UPDATE public.leaderboard_contributions
SET contributor_hash = md5(coalesce(user_id::text, session_id::text, id::text))
WHERE contributor_hash IS NULL;

-- Trigger to populate contributor_hash on write (id default is applied before BEFORE triggers)
CREATE OR REPLACE FUNCTION public.set_leaderboard_contributor_hash()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.contributor_hash := md5(coalesce(NEW.user_id::text, NEW.session_id::text, NEW.id::text));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_leaderboard_contributor_hash ON public.leaderboard_contributions;
CREATE TRIGGER trg_set_leaderboard_contributor_hash
BEFORE INSERT OR UPDATE ON public.leaderboard_contributions
FOR EACH ROW EXECUTE FUNCTION public.set_leaderboard_contributor_hash();

-- Recreate the public view as SECURITY INVOKER (no longer references user_id/session_id)
DROP VIEW IF EXISTS public.leaderboard_contributions_public;
CREATE VIEW public.leaderboard_contributions_public
WITH (security_invoker=on) AS
SELECT
  id,
  contributor_hash,
  country_code,
  country_name,
  category,
  points,
  source_detail,
  created_at
FROM public.leaderboard_contributions;

-- Allow public read at the RLS level (needed for the invoker view).
DROP POLICY IF EXISTS "Public can read anonymized leaderboard columns" ON public.leaderboard_contributions;
CREATE POLICY "Public can read anonymized leaderboard columns"
ON public.leaderboard_contributions
FOR SELECT
TO anon, authenticated
USING (true);

-- Column-level grants: expose only the non-sensitive columns to public roles.
-- user_id and session_id are intentionally NOT granted, so they can never be
-- selected directly even though row-level read is allowed.
GRANT SELECT (id, contributor_hash, country_code, country_name, category, points, source_detail, created_at)
  ON public.leaderboard_contributions TO anon, authenticated;

GRANT SELECT ON public.leaderboard_contributions_public TO anon, authenticated;
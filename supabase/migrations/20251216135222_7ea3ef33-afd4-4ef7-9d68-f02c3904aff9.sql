-- Enable RLS on api_rate_limits table
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- The edge function uses service role which bypasses RLS
-- Only admins should be able to view rate limit data for monitoring
CREATE POLICY "Admins can view rate limits"
ON public.api_rate_limits FOR SELECT
TO authenticated
USING (is_admin_or_editor(auth.uid()));

-- Allow service role (edge functions) full access via RLS bypass
-- No explicit policy needed as service role bypasses RLS
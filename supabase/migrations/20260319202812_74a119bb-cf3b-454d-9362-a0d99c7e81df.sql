
-- Leaderboard contributions table
CREATE TABLE public.leaderboard_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  session_id text,
  country_code text NOT NULL,
  country_name text NOT NULL,
  category text NOT NULL,
  points integer NOT NULL DEFAULT 1,
  source_detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast country aggregation
CREATE INDEX idx_leaderboard_country ON public.leaderboard_contributions (country_code);
CREATE INDEX idx_leaderboard_category ON public.leaderboard_contributions (category);
CREATE INDEX idx_leaderboard_created ON public.leaderboard_contributions (created_at);

-- Enable RLS
ALTER TABLE public.leaderboard_contributions ENABLE ROW LEVEL SECURITY;

-- Public read access for leaderboard display
CREATE POLICY "Anyone can view leaderboard"
  ON public.leaderboard_contributions
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert only via service role (edge function)
CREATE POLICY "Service role can insert leaderboard entries"
  ON public.leaderboard_contributions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

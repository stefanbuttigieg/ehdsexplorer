-- Create table to track global daily AI usage
CREATE TABLE public.ai_daily_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usage_date date NOT NULL UNIQUE DEFAULT CURRENT_DATE,
  request_count integer NOT NULL DEFAULT 0,
  daily_limit integer NOT NULL DEFAULT 30,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_daily_usage ENABLE ROW LEVEL SECURITY;

-- Anyone can read usage stats
CREATE POLICY "Anyone can read AI usage stats"
ON public.ai_daily_usage
FOR SELECT
USING (true);

-- Only service role can update (via edge function)
-- No insert/update/delete policies for regular users

-- Create trigger for updated_at
CREATE TRIGGER update_ai_daily_usage_updated_at
BEFORE UPDATE ON public.ai_daily_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
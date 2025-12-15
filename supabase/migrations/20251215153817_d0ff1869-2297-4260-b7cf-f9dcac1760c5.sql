-- Create rate limiting table
CREATE TABLE public.api_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast IP lookups
CREATE INDEX idx_api_rate_limits_ip ON public.api_rate_limits(ip_address);
CREATE INDEX idx_api_rate_limits_window ON public.api_rate_limits(window_start);

-- No RLS needed - this table is only accessed by the edge function using service role
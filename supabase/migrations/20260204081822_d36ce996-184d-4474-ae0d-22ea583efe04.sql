-- Table for storing API keys (key_hash stores SHA-256 hash of the key)
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- First 8 chars of key for identification (e.g., "ehds_abc1")
  key_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the full key
  country_codes TEXT[] NOT NULL DEFAULT '{}', -- Countries this key can access
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional expiration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys
CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own keys
CREATE POLICY "Users can create own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own keys (e.g., revoke)
CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own keys
CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all keys
CREATE POLICY "Admins can view all API keys"
  ON public.api_keys FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Table for API request logs
CREATE TABLE public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  country_code TEXT,
  obligation_id TEXT,
  status_code INTEGER NOT NULL,
  response_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  request_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own logs
CREATE POLICY "Users can view own API logs"
  ON public.api_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all API logs"
  ON public.api_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Create indexes for performance
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_key_prefix ON public.api_keys(key_prefix);
CREATE INDEX idx_api_logs_user_id ON public.api_logs(user_id);
CREATE INDEX idx_api_logs_api_key_id ON public.api_logs(api_key_id);
CREATE INDEX idx_api_logs_created_at ON public.api_logs(created_at DESC);
CREATE INDEX idx_api_logs_endpoint ON public.api_logs(endpoint);

-- Trigger for updated_at
CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create subscriptions table for implementing act alerts
CREATE TABLE public.implementing_act_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  implementing_act_id TEXT REFERENCES public.implementing_acts(id) ON DELETE CASCADE,
  subscribe_all BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  UNIQUE(email, implementing_act_id)
);

-- Enable RLS
ALTER TABLE public.implementing_act_subscriptions ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert their own email)
CREATE POLICY "Anyone can subscribe"
ON public.implementing_act_subscriptions
FOR INSERT
WITH CHECK (true);

-- Users can view their own subscriptions by unsubscribe token
CREATE POLICY "View by unsubscribe token"
ON public.implementing_act_subscriptions
FOR SELECT
USING (true);

-- Users can unsubscribe using their unsubscribe token
CREATE POLICY "Unsubscribe with token"
ON public.implementing_act_subscriptions
FOR DELETE
USING (true);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.implementing_act_subscriptions
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_subscriptions_implementing_act ON public.implementing_act_subscriptions(implementing_act_id);
CREATE INDEX idx_subscriptions_email ON public.implementing_act_subscriptions(email);
CREATE INDEX idx_subscriptions_subscribe_all ON public.implementing_act_subscriptions(subscribe_all) WHERE subscribe_all = true;

-- Add trigger column to track old status
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS previous_status TEXT;
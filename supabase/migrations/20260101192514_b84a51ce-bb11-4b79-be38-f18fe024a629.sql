-- Update the default value for verified to false (new subscriptions need verification)
ALTER TABLE public.implementing_act_subscriptions 
ALTER COLUMN verified SET DEFAULT false;

-- Add a verification_token column for the verification email link
ALTER TABLE public.implementing_act_subscriptions 
ADD COLUMN IF NOT EXISTS verification_token uuid DEFAULT gen_random_uuid();
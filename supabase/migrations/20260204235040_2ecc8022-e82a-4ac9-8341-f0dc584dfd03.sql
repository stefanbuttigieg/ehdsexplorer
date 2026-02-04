-- Add columns for storing email OTP codes
ALTER TABLE public.user_mfa_preferences 
ADD COLUMN IF NOT EXISTS email_otp_code TEXT,
ADD COLUMN IF NOT EXISTS email_otp_expires_at TIMESTAMPTZ;
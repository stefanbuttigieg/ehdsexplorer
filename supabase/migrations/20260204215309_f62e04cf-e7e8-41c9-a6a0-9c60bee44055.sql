-- Create MFA settings table for admin control
CREATE TABLE public.mfa_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enforcement_enabled boolean NOT NULL DEFAULT false,
  enforcement_start_date timestamp with time zone,
  grace_period_end_date timestamp with time zone,
  reminder_enabled boolean NOT NULL DEFAULT true,
  allowed_methods text[] NOT NULL DEFAULT ARRAY['totp', 'email']::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage MFA settings
CREATE POLICY "Super admins can manage MFA settings"
ON public.mfa_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Allow authenticated users to read MFA settings (needed to check enforcement)
CREATE POLICY "Authenticated users can read MFA settings"
ON public.mfa_settings
FOR SELECT
TO authenticated
USING (true);

-- Insert default settings row
INSERT INTO public.mfa_settings (id, enforcement_enabled, reminder_enabled, allowed_methods)
VALUES ('00000000-0000-0000-0000-000000000001', false, true, ARRAY['totp', 'email']::text[]);

-- Create user MFA preferences table to track dismissals and preferences
CREATE TABLE public.user_mfa_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_dismissed_at timestamp with time zone,
  reminder_snooze_until timestamp with time zone,
  preferred_method text DEFAULT 'totp',
  email_otp_enabled boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_mfa_preferences ENABLE ROW LEVEL SECURITY;

-- Users can manage their own MFA preferences
CREATE POLICY "Users can manage their own MFA preferences"
ON public.user_mfa_preferences
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view all user MFA preferences
CREATE POLICY "Admins can view all MFA preferences"
ON public.user_mfa_preferences
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Add updated_at trigger
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_mfa_preferences_updated_at
  BEFORE UPDATE ON public.user_mfa_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
-- Create site_settings table for maintenance mode and other settings
CREATE TABLE public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT 'We are currently updating our content. Please check back shortly.',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (needed to check maintenance mode)
CREATE POLICY "Anyone can read site settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update site settings" 
ON public.site_settings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings row
INSERT INTO public.site_settings (id, maintenance_mode, maintenance_message) 
VALUES ('default', false, 'We are currently updating our content. Please check back shortly.');
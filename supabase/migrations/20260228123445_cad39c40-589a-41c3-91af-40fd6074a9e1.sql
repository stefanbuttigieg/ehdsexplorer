
-- Add ai_model column to site_settings
ALTER TABLE public.site_settings
ADD COLUMN ai_model text NOT NULL DEFAULT 'google/gemini-2.5-flash';

-- Recreate the public view to include ai_model
DROP VIEW IF EXISTS public.site_settings_public;
CREATE VIEW public.site_settings_public AS
  SELECT id, maintenance_mode, maintenance_message, ai_model, updated_at, updated_by
  FROM public.site_settings;

-- Grant access to the view
GRANT SELECT ON public.site_settings_public TO anon, authenticated;

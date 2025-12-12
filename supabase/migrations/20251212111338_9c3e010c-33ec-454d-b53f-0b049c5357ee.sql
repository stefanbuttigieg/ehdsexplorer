-- Drop and recreate the view with SECURITY INVOKER (the default, but being explicit)
DROP VIEW IF EXISTS public.site_settings_public;

CREATE VIEW public.site_settings_public 
WITH (security_invoker = true) AS
SELECT id, maintenance_mode, maintenance_message, updated_at
FROM public.site_settings;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.site_settings_public TO anon, authenticated;
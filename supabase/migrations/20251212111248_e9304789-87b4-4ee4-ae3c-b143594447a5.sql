-- Create a public view without the updated_by field for public access
CREATE VIEW public.site_settings_public AS
SELECT id, maintenance_mode, maintenance_message, updated_at
FROM public.site_settings;

-- Drop the existing public SELECT policy
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

-- Create new policy: only admins can read the full table (including updated_by)
CREATE POLICY "Admins can read full site settings" 
ON public.site_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.site_settings_public TO anon, authenticated;
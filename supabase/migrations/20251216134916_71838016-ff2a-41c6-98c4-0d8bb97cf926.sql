-- Add super_admin to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Fix email_templates RLS policy - restrict to admin/editor only
DROP POLICY IF EXISTS "Anyone can read email templates" ON email_templates;

CREATE POLICY "Admins and editors can read email templates"
ON email_templates FOR SELECT
TO authenticated
USING (is_admin_or_editor(auth.uid()));
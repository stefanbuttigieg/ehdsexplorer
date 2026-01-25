-- Create table for user country assignments
CREATE TABLE public.user_country_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, country_code)
);

-- Enable RLS
ALTER TABLE public.user_country_assignments ENABLE ROW LEVEL SECURITY;

-- Only admins can view all assignments
CREATE POLICY "Admins can view all country assignments"
ON public.user_country_assignments
FOR SELECT
USING (is_admin_or_editor(auth.uid()));

-- Only admins can insert assignments
CREATE POLICY "Admins can insert country assignments"
ON public.user_country_assignments
FOR INSERT
WITH CHECK (
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'))
  AND auth.uid() = assigned_by
);

-- Only admins can update assignments
CREATE POLICY "Admins can update country assignments"
ON public.user_country_assignments
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Only admins can delete assignments
CREATE POLICY "Admins can delete country assignments"
ON public.user_country_assignments
FOR DELETE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

-- Create function to check if user is assigned to a country
CREATE OR REPLACE FUNCTION public.is_assigned_to_country(_user_id uuid, _country_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_country_assignments
    WHERE user_id = _user_id
      AND country_code = _country_code
  )
$$;

-- Drop existing policy for updating country_obligation_status
DROP POLICY IF EXISTS "Admins can manage country obligation status" ON public.country_obligation_status;

-- Create new policies that allow assigned users to manage their countries
CREATE POLICY "Admins and assigned users can manage country obligation status"
ON public.country_obligation_status
FOR ALL
USING (
  is_admin_or_editor(auth.uid()) 
  OR is_assigned_to_country(auth.uid(), country_code)
)
WITH CHECK (
  is_admin_or_editor(auth.uid()) 
  OR is_assigned_to_country(auth.uid(), country_code)
);
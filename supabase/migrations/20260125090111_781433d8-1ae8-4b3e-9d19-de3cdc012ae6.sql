-- Add policy to allow users to view their own country assignments
CREATE POLICY "Users can view their own country assignments"
ON public.user_country_assignments
FOR SELECT
USING (auth.uid() = user_id);
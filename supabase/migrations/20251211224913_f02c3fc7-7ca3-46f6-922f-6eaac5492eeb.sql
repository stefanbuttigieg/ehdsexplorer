-- Allow users to read their own roles (needed for role checking in the app)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);
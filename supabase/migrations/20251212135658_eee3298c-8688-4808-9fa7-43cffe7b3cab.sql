-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a cleaner, more secure policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);
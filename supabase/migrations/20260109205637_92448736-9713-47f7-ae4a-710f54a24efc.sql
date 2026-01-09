-- Drop and recreate the INSERT policy for teams with correct role targeting
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;

CREATE POLICY "Authenticated users can create teams" 
ON public.teams 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also need to ensure the UPDATE and DELETE policies target authenticated users
DROP POLICY IF EXISTS "Team owners and admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete teams" ON public.teams;

CREATE POLICY "Team owners and admins can update teams" 
ON public.teams 
FOR UPDATE 
TO authenticated
USING (public.has_team_role(auth.uid(), id, ARRAY['owner'::team_role, 'admin'::team_role]));

CREATE POLICY "Team owners can delete teams" 
ON public.teams 
FOR DELETE 
TO authenticated
USING (public.has_team_role(auth.uid(), id, ARRAY['owner'::team_role]));
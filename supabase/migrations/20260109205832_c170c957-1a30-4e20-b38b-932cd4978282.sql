-- Create the trigger to add team creator as owner
CREATE OR REPLACE FUNCTION public.add_team_creator_as_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_memberships (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');
  RETURN NEW;
END;
$$;

-- Create the trigger on teams table
DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
  AFTER INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.add_team_creator_as_owner();

-- Update the SELECT policy to also allow the creator to see the team (for the immediate return after insert)
DROP POLICY IF EXISTS "Users can view teams they belong to" ON public.teams;

CREATE POLICY "Users can view teams they belong to" 
ON public.teams 
FOR SELECT 
TO authenticated
USING (
  public.is_team_member(auth.uid(), id) 
  OR created_by = auth.uid()
);
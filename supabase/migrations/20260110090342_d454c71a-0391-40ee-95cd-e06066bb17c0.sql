-- Create trigger to automatically log when a new member joins
CREATE OR REPLACE FUNCTION public.log_team_member_joined()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.team_activity (team_id, user_id, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.team_id,
    NEW.user_id,
    'member_joined',
    'membership',
    NEW.id,
    jsonb_build_object('role', NEW.role)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS on_team_member_joined ON public.team_memberships;
CREATE TRIGGER on_team_member_joined
  AFTER INSERT ON public.team_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.log_team_member_joined();
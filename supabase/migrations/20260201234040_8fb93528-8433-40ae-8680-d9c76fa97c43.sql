-- Fix shared_notes RLS: Ensure users can only share notes they own
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Team members can share notes" ON public.shared_notes;

-- Create a SECURITY DEFINER function to check note ownership
CREATE OR REPLACE FUNCTION public.is_note_owner(_user_id uuid, _note_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_notes
    WHERE id = _note_id
      AND user_id = _user_id
  )
$$;

-- Create new INSERT policy that verifies note ownership
CREATE POLICY "Team members can share their own notes"
ON public.shared_notes
FOR INSERT
WITH CHECK (
  has_team_role(auth.uid(), team_id, ARRAY['owner'::team_role, 'admin'::team_role, 'member'::team_role])
  AND auth.uid() = shared_by
  AND is_note_owner(auth.uid(), note_id)
);
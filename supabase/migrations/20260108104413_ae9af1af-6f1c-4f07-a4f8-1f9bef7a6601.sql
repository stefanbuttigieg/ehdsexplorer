
-- Create team role enum
CREATE TYPE public.team_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Teams table - Named workspaces for collaboration
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team memberships - Users belong to teams with roles
CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Shared annotations - Team members can share highlights
CREATE TABLE public.shared_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  annotation_id UUID NOT NULL REFERENCES public.annotations(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, annotation_id)
);

-- Shared notes - Team notes feature
CREATE TABLE public.shared_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES public.user_notes(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, note_id)
);

-- Shared bookmarks - Shared saved items
CREATE TABLE public.shared_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL,
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, content_type, content_id)
);

-- Activity feed - Track team activity
CREATE TABLE public.team_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX idx_shared_annotations_team_id ON public.shared_annotations(team_id);
CREATE INDEX idx_shared_notes_team_id ON public.shared_notes(team_id);
CREATE INDEX idx_shared_bookmarks_team_id ON public.shared_bookmarks(team_id);
CREATE INDEX idx_team_activity_team_id ON public.team_activity(team_id);
CREATE INDEX idx_team_activity_created_at ON public.team_activity(created_at DESC);

-- Helper function to check team membership role
CREATE OR REPLACE FUNCTION public.has_team_role(_user_id UUID, _team_id UUID, _roles team_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = ANY(_roles)
  )
$$;

-- Function to check if user is team member
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_memberships
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_activity ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they belong to"
ON public.teams FOR SELECT
USING (public.is_team_member(auth.uid(), id));

CREATE POLICY "Authenticated users can create teams"
ON public.teams FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owners and admins can update teams"
ON public.teams FOR UPDATE
USING (public.has_team_role(auth.uid(), id, ARRAY['owner', 'admin']::team_role[]));

CREATE POLICY "Team owners can delete teams"
ON public.teams FOR DELETE
USING (public.has_team_role(auth.uid(), id, ARRAY['owner']::team_role[]));

-- Team memberships policies
CREATE POLICY "Members can view team memberships"
ON public.team_memberships FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Owners and admins can add members"
ON public.team_memberships FOR INSERT
TO authenticated
WITH CHECK (
  public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[])
  OR (auth.uid() = user_id AND NOT EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = team_memberships.team_id))
);

CREATE POLICY "Owners and admins can update memberships"
ON public.team_memberships FOR UPDATE
USING (public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[]));

CREATE POLICY "Owners can remove members or members can leave"
ON public.team_memberships FOR DELETE
USING (
  public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[])
  OR auth.uid() = user_id
);

-- Shared annotations policies
CREATE POLICY "Team members can view shared annotations"
ON public.shared_annotations FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can share annotations"
ON public.shared_annotations FOR INSERT
TO authenticated
WITH CHECK (
  public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin', 'member']::team_role[])
  AND auth.uid() = shared_by
);

CREATE POLICY "Sharers or admins can unshare annotations"
ON public.shared_annotations FOR DELETE
USING (
  auth.uid() = shared_by
  OR public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[])
);

-- Shared notes policies
CREATE POLICY "Team members can view shared notes"
ON public.shared_notes FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can share notes"
ON public.shared_notes FOR INSERT
TO authenticated
WITH CHECK (
  public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin', 'member']::team_role[])
  AND auth.uid() = shared_by
);

CREATE POLICY "Sharers or admins can unshare notes"
ON public.shared_notes FOR DELETE
USING (
  auth.uid() = shared_by
  OR public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[])
);

-- Shared bookmarks policies
CREATE POLICY "Team members can view shared bookmarks"
ON public.shared_bookmarks FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can share bookmarks"
ON public.shared_bookmarks FOR INSERT
TO authenticated
WITH CHECK (
  public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin', 'member']::team_role[])
  AND auth.uid() = shared_by
);

CREATE POLICY "Sharers or admins can unshare bookmarks"
ON public.shared_bookmarks FOR DELETE
USING (
  auth.uid() = shared_by
  OR public.has_team_role(auth.uid(), team_id, ARRAY['owner', 'admin']::team_role[])
);

-- Team activity policies
CREATE POLICY "Team members can view activity"
ON public.team_activity FOR SELECT
USING (public.is_team_member(auth.uid(), team_id));

CREATE POLICY "Team members can log activity"
ON public.team_activity FOR INSERT
TO authenticated
WITH CHECK (
  public.is_team_member(auth.uid(), team_id)
  AND auth.uid() = user_id
);

-- Trigger to add creator as owner when team is created
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

CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.add_team_creator_as_owner();

-- Trigger to update updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

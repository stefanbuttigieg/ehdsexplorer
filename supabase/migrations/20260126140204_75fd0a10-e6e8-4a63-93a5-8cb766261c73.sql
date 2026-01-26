-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Anyone can read feature flags (needed to check if feature is enabled)
CREATE POLICY "Anyone can read feature flags"
ON public.feature_flags
FOR SELECT
USING (true);

-- Only super_admin can modify feature flags
CREATE POLICY "Super admins can update feature flags"
ON public.feature_flags
FOR UPDATE
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert feature flags"
ON public.feature_flags
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can delete feature flags"
ON public.feature_flags
FOR DELETE
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial feature flags
INSERT INTO public.feature_flags (id, name, description, is_enabled) VALUES
  ('implementation_tracker', 'Implementation Tracker', 'Member state EHDS implementation progress tracker', true),
  ('ai_assistant', 'AI Assistant', 'EHDS AI chat assistant for answering questions', true),
  ('teams', 'Teams', 'Team workspaces for collaborative annotations and bookmarks', true);
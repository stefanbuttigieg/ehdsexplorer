-- Create table for implementation tracker configuration
CREATE TABLE public.implementation_tracker_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  
  -- Weight configuration (percentages that must sum to 100)
  dha_weight INTEGER NOT NULL DEFAULT 33,
  hdab_weight INTEGER NOT NULL DEFAULT 33,
  legislation_weight INTEGER NOT NULL DEFAULT 34,
  
  -- DHA status percentages
  dha_active_value INTEGER NOT NULL DEFAULT 100,
  dha_pending_value INTEGER NOT NULL DEFAULT 50,
  dha_planned_value INTEGER NOT NULL DEFAULT 25,
  dha_inactive_value INTEGER NOT NULL DEFAULT 0,
  
  -- HDAB status percentages
  hdab_active_value INTEGER NOT NULL DEFAULT 100,
  hdab_pending_value INTEGER NOT NULL DEFAULT 50,
  hdab_planned_value INTEGER NOT NULL DEFAULT 25,
  hdab_inactive_value INTEGER NOT NULL DEFAULT 0,
  
  -- Legislation status values (what counts as "adopted")
  legislation_adopted_statuses TEXT[] NOT NULL DEFAULT ARRAY['adopted', 'in_force']::TEXT[],
  
  -- Metadata
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.implementation_tracker_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read the config
CREATE POLICY "Anyone can read implementation tracker config"
  ON public.implementation_tracker_config
  FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update implementation tracker config"
  ON public.implementation_tracker_config
  FOR UPDATE
  USING (is_admin_or_editor(auth.uid()));

-- Only admins can insert
CREATE POLICY "Admins can insert implementation tracker config"
  ON public.implementation_tracker_config
  FOR INSERT
  WITH CHECK (is_admin_or_editor(auth.uid()));

-- Insert default configuration
INSERT INTO public.implementation_tracker_config (id) VALUES ('default');

-- Add updated_at trigger
CREATE TRIGGER update_implementation_tracker_config_updated_at
  BEFORE UPDATE ON public.implementation_tracker_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
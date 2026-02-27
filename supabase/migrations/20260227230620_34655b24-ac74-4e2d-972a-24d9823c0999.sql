-- Audit trail for obligation status changes
CREATE TABLE public.obligation_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  obligation_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.obligation_status_history ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view obligation status history"
  ON public.obligation_status_history
  FOR SELECT
  USING (true);

-- Only system (via trigger) writes; admins can also insert manually
CREATE POLICY "Admins can insert status history"
  ON public.obligation_status_history
  FOR INSERT
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Index for efficient lookups
CREATE INDEX idx_status_history_country_obligation 
  ON public.obligation_status_history(country_code, obligation_id);

-- Trigger function to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_obligation_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.obligation_status_history (country_code, obligation_id, old_status, new_status, changed_by)
    VALUES (NEW.country_code, NEW.obligation_id, NULL, NEW.status, auth.uid());
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.obligation_status_history (country_code, obligation_id, old_status, new_status, changed_by)
    VALUES (NEW.country_code, NEW.obligation_id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Attach trigger to country_obligation_status table
CREATE TRIGGER track_obligation_status_changes
  AFTER INSERT OR UPDATE ON public.country_obligation_status
  FOR EACH ROW
  EXECUTE FUNCTION public.log_obligation_status_change();
-- Create joint_action_deliverables table
CREATE TABLE public.joint_action_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  joint_action_name text NOT NULL,
  deliverable_name text NOT NULL,
  deliverable_link text NOT NULL,
  related_articles integer[] DEFAULT '{}',
  related_implementing_acts text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.joint_action_deliverables ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can read joint_action_deliverables"
ON public.joint_action_deliverables
FOR SELECT
USING (true);

-- Admin/editor write access
CREATE POLICY "Admins can insert joint_action_deliverables"
ON public.joint_action_deliverables
FOR INSERT
WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update joint_action_deliverables"
ON public.joint_action_deliverables
FOR UPDATE
USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete joint_action_deliverables"
ON public.joint_action_deliverables
FOR DELETE
USING (is_admin_or_editor(auth.uid()));

-- Add updated_at trigger
CREATE TRIGGER update_joint_action_deliverables_updated_at
BEFORE UPDATE ON public.joint_action_deliverables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
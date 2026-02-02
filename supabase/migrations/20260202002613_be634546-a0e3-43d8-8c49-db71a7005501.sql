-- Add project_type column to classify EU projects
ALTER TABLE public.joint_action_deliverables 
ADD COLUMN project_type text NOT NULL DEFAULT 'joint_action';

-- Add comment for documentation
COMMENT ON COLUMN public.joint_action_deliverables.project_type IS 'Type of EU project: joint_action, erasmus_plus, horizon, etc.';
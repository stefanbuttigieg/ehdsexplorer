-- Create role_permissions table for granular permissions
CREATE TABLE public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  content_type text NOT NULL,
  can_create boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  can_publish boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(role, content_type)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only super_admins can manage permissions
CREATE POLICY "Super admins can manage permissions" 
ON public.role_permissions 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- All admins and editors can read permissions
CREATE POLICY "Admins and editors can read permissions" 
ON public.role_permissions 
FOR SELECT 
USING (public.is_admin_or_editor(auth.uid()));

-- Create function to check specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _content_type text, _action text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.content_type = _content_type
      AND (
        (_action = 'create' AND rp.can_create = true) OR
        (_action = 'edit' AND rp.can_edit = true) OR
        (_action = 'delete' AND rp.can_delete = true) OR
        (_action = 'publish' AND rp.can_publish = true)
      )
  )
  OR public.has_role(_user_id, 'super_admin')
$$;

-- Create function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'super_admin')
$$;

-- Update is_admin_or_editor to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_editor(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('super_admin', 'admin', 'editor')
  )
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
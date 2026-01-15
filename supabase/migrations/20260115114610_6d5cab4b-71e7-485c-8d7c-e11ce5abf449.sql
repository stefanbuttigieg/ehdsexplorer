-- Create table for help center FAQ items
CREATE TABLE public.help_center_faq (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_center_faq ENABLE ROW LEVEL SECURITY;

-- Public can read published FAQs
CREATE POLICY "Anyone can view published FAQs"
ON public.help_center_faq
FOR SELECT
USING (is_published = true);

-- Admins and editors can manage FAQs
CREATE POLICY "Admins can manage FAQs"
ON public.help_center_faq
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'editor')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin') OR 
  public.has_role(auth.uid(), 'editor')
);

-- Create updated_at trigger
CREATE TRIGGER update_help_center_faq_updated_at
BEFORE UPDATE ON public.help_center_faq
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create header_items table for admin-managed top header
CREATE TABLE public.header_items (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  component_key TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  show_on_desktop BOOLEAN NOT NULL DEFAULT true,
  show_on_mobile BOOLEAN NOT NULL DEFAULT true,
  show_when_logged_in BOOLEAN NOT NULL DEFAULT true,
  show_when_logged_out BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.header_items ENABLE ROW LEVEL SECURITY;

-- Anyone can read (needed for header rendering)
CREATE POLICY "Header items readable by all"
  ON public.header_items FOR SELECT
  USING (true);

-- Only admins/super_admins can modify
CREATE POLICY "Admins can insert header items"
  ON public.header_items FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update header items"
  ON public.header_items FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete header items"
  ON public.header_items FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_header_items_updated_at
  BEFORE UPDATE ON public.header_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default header items matching current Layout.tsx header
INSERT INTO public.header_items (id, label, component_key, sort_order) VALUES
  ('stakeholder_filter', 'Stakeholder Filter', 'stakeholder_filter', 10),
  ('kids_mode', 'Kids Mode Toggle', 'kids_mode', 20),
  ('language_selector', 'Language Selector', 'language_selector', 30),
  ('accessibility', 'Accessibility Controls', 'accessibility', 40),
  ('user_menu', 'User Menu / Sign In', 'user_menu', 50);
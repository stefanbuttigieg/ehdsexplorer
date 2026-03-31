
CREATE TABLE public.sidebar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  path text NOT NULL,
  icon_name text NOT NULL DEFAULT 'FileText',
  section text NOT NULL DEFAULT 'main' CHECK (section IN ('main', 'legal', 'utility')),
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  feature_flag_id text REFERENCES public.feature_flags(id) ON DELETE SET NULL,
  requires_auth boolean NOT NULL DEFAULT false,
  open_external boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(path)
);

ALTER TABLE public.sidebar_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read sidebar items
CREATE POLICY "Anyone can read sidebar items" ON public.sidebar_items
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage sidebar items" ON public.sidebar_items
  FOR ALL TO authenticated
  USING (public.is_admin_or_editor(auth.uid()))
  WITH CHECK (public.is_admin_or_editor(auth.uid()));

-- Seed with current navigation items
INSERT INTO public.sidebar_items (label, path, icon_name, section, sort_order) VALUES
  ('Home', '/', 'Home', 'main', 0),
  ('Overview', '/overview', 'Book', 'main', 1),
  ('Definitions', '/definitions', 'FileText', 'main', 2),
  ('Articles', '/articles', 'FileText', 'main', 3),
  ('Recitals', '/recitals', 'Scale', 'main', 4),
  ('Annexes', '/annexes', 'Files', 'main', 5),
  ('Implementing Acts', '/implementing-acts', 'ListChecks', 'main', 6),
  ('EHDS Country Map', '/health-authorities', 'Globe', 'main', 7),
  ('Regulatory Map', '/cross-regulation-map', 'Network', 'main', 8),
  ('Article Dependencies', '/article-dependencies', 'GitCompare', 'main', 9),
  ('Content Network', '/content-network', 'Network', 'main', 10),
  ('For Citizens', '/for/citizens', 'Heart', 'main', 11),
  ('For Health Tech', '/for/healthtech', 'Laptop', 'main', 12),
  ('For Healthcare Pros', '/for/healthcare-professionals', 'Stethoscope', 'main', 13),
  ('Topic Index', '/topic-index', 'FileText', 'main', 14),
  ('Tools Hub', '/tools', 'Wrench', 'main', 15),
  ('Scenario Finder', '/scenario-finder', 'Sparkles', 'main', 16),
  ('News', '/news', 'Newspaper', 'main', 17),
  ('Official FAQs', '/faqs', 'MessageCircleQuestion', 'main', 18),
  ('Bookmarks', '/bookmarks', 'Bookmark', 'main', 19),
  ('Notes', '/notes', 'StickyNote', 'main', 20),
  ('Achievements', '/profile?tab=achievements', 'Trophy', 'main', 21),
  ('Compare', '/compare', 'GitCompare', 'main', 22),
  ('Leaderboard', '/leaderboard', 'Medal', 'main', 23),
  ('Games', '/games', 'Brain', 'main', 24),
  ('Help Center', '/help', 'HelpCircle', 'utility', 30),
  ('API Documentation', '/api', 'Code', 'utility', 31),
  ('Privacy Policy', '/privacy-policy', 'Shield', 'legal', 40),
  ('Cookies Policy', '/cookies-policy', 'Cookie', 'legal', 41),
  ('Terms of Service', '/terms-of-service', 'ScrollText', 'legal', 42),
  ('Accessibility', '/accessibility', 'Accessibility', 'legal', 43);

-- Update trigger
CREATE TRIGGER update_sidebar_items_updated_at
  BEFORE UPDATE ON public.sidebar_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

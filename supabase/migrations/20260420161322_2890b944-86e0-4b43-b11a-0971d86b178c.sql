
-- Seed default header_items with stable string IDs (idempotent)
INSERT INTO public.header_items (id, component_key, label, sort_order, is_visible, show_on_desktop, show_on_mobile, show_when_logged_in, show_when_logged_out)
VALUES
  ('stakeholder_filter', 'stakeholder_filter', 'Stakeholder Filter', 10, true, true, true, true, true),
  ('kids_mode', 'kids_mode', 'Kids Mode Toggle', 20, true, true, true, true, true),
  ('language_selector', 'language_selector', 'Language Selector', 30, true, true, true, true, true),
  ('accessibility', 'accessibility', 'Accessibility Controls', 40, true, true, true, true, true),
  ('user_menu', 'user_menu', 'User Menu / Sign In', 50, true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;

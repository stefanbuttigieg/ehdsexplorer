-- Seed default header_items if table is empty (runs in both Test and Live on publish)
INSERT INTO public.header_items (id, component_key, label, sort_order, is_visible, show_on_desktop, show_on_mobile, show_when_logged_in, show_when_logged_out)
SELECT gen_random_uuid(), v.component_key, v.label, v.sort_order, true, true, true, true, true
FROM (VALUES
  ('stakeholder_filter', 'Stakeholder Filter', 10),
  ('kids_mode', 'Kids Mode Toggle', 20),
  ('language_selector', 'Language Selector', 30),
  ('accessibility', 'Accessibility Controls', 40),
  ('user_menu', 'User Menu / Sign In', 50)
) AS v(component_key, label, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.header_items WHERE component_key = v.component_key
);

ALTER TABLE public.sidebar_items
  ADD COLUMN show_in_kids_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN show_in_mobile_nav BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN mobile_sort_order INTEGER NOT NULL DEFAULT 0;

-- Seed existing kids-friendly paths
UPDATE public.sidebar_items SET show_in_kids_mode = true WHERE path IN ('/', '/kids', '/games', '/for/citizens', '/help', '/privacy-policy', '/cookies-policy', '/terms-of-service', '/accessibility');

-- Seed existing mobile nav items
UPDATE public.sidebar_items SET show_in_mobile_nav = true, mobile_sort_order = 0 WHERE path = '/';
UPDATE public.sidebar_items SET show_in_mobile_nav = true, mobile_sort_order = 1 WHERE path = '/overview';
UPDATE public.sidebar_items SET show_in_mobile_nav = true, mobile_sort_order = 2 WHERE path = '/articles';
UPDATE public.sidebar_items SET show_in_mobile_nav = true, mobile_sort_order = 3 WHERE path = '/implementing-acts';

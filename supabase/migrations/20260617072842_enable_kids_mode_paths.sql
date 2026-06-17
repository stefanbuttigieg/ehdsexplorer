-- Flag kid-friendly pages so Kids Mode works (test + live).
-- Without these flags the Kids Mode guard redirects every route back home.
UPDATE public.sidebar_items
SET show_in_kids_mode = true
WHERE path IN (
  '/',
  '/accessibility',
  '/cookies-policy',
  '/for/citizens',
  '/games',
  '/help',
  '/privacy-policy',
  '/terms-of-service'
);

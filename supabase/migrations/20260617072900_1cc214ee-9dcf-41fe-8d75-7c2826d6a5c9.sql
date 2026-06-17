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
UPDATE public.sidebar_items
SET show_in_kids_mode = true,
    updated_at = now()
WHERE path IN (
  '/',
  '/kids',
  '/accessibility',
  '/cookies-policy',
  '/for/citizens',
  '/games',
  '/help',
  '/privacy-policy',
  '/terms-of-service'
);
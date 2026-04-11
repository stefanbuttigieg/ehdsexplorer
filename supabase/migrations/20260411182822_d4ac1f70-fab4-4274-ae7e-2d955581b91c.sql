-- One-time bulk confirm all existing newsletter subscribers on both environments
UPDATE public.newsletter_subscriptions
SET is_verified = true,
    verified_at = COALESCE(verified_at, now())
WHERE is_verified = false
  AND unsubscribed_at IS NULL;
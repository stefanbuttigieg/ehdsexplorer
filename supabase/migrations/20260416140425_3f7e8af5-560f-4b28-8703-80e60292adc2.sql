
DROP POLICY IF EXISTS "Anyone can create subscriptions" ON public.implementing_act_subscriptions;
CREATE POLICY "Anyone can create subscriptions"
ON public.implementing_act_subscriptions
FOR INSERT
WITH CHECK (verified = false);

-- First drop ALL existing policies on implementing_act_subscriptions
DROP POLICY IF EXISTS "View by unsubscribe token" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Unsubscribe with token" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Anyone can insert subscriptions" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Anyone can create subscriptions" ON public.implementing_act_subscriptions;
DROP POLICY IF EXISTS "Admins can update subscriptions" ON public.implementing_act_subscriptions;

-- Create secure policies that don't expose email data publicly
-- Only admins can view all subscriptions (for management dashboard)
CREATE POLICY "Admins can view all subscriptions"
  ON public.implementing_act_subscriptions
  FOR SELECT
  USING (is_admin_or_editor(auth.uid()));

-- Only admins can delete subscriptions from dashboard
-- Token-based unsubscribe is handled via edge function with service role
CREATE POLICY "Admins can delete subscriptions"
  ON public.implementing_act_subscriptions
  FOR DELETE
  USING (is_admin_or_editor(auth.uid()));

-- Allow public inserts for subscription creation
-- Email format validation happens at application level
CREATE POLICY "Anyone can create subscriptions"
  ON public.implementing_act_subscriptions
  FOR INSERT
  WITH CHECK (true);

-- Admins can update subscriptions (e.g., verify status)
CREATE POLICY "Admins can update subscriptions"
  ON public.implementing_act_subscriptions
  FOR UPDATE
  USING (is_admin_or_editor(auth.uid()));
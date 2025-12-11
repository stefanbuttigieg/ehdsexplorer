-- Fix RLS policies to be PERMISSIVE (default) instead of RESTRICTIVE
-- Drop all existing policies and recreate them as PERMISSIVE

-- Articles
DROP POLICY IF EXISTS "Admins can manage articles" ON public.articles;
DROP POLICY IF EXISTS "Anyone can read articles" ON public.articles;

CREATE POLICY "Anyone can read articles" ON public.articles
FOR SELECT USING (true);

CREATE POLICY "Admins can insert articles" ON public.articles
FOR INSERT TO authenticated WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update articles" ON public.articles
FOR UPDATE TO authenticated USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete articles" ON public.articles
FOR DELETE TO authenticated USING (is_admin_or_editor(auth.uid()));

-- Recitals
DROP POLICY IF EXISTS "Admins can manage recitals" ON public.recitals;
DROP POLICY IF EXISTS "Anyone can read recitals" ON public.recitals;

CREATE POLICY "Anyone can read recitals" ON public.recitals
FOR SELECT USING (true);

CREATE POLICY "Admins can insert recitals" ON public.recitals
FOR INSERT TO authenticated WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update recitals" ON public.recitals
FOR UPDATE TO authenticated USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete recitals" ON public.recitals
FOR DELETE TO authenticated USING (is_admin_or_editor(auth.uid()));

-- Definitions
DROP POLICY IF EXISTS "Admins can manage definitions" ON public.definitions;
DROP POLICY IF EXISTS "Anyone can read definitions" ON public.definitions;

CREATE POLICY "Anyone can read definitions" ON public.definitions
FOR SELECT USING (true);

CREATE POLICY "Admins can insert definitions" ON public.definitions
FOR INSERT TO authenticated WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update definitions" ON public.definitions
FOR UPDATE TO authenticated USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete definitions" ON public.definitions
FOR DELETE TO authenticated USING (is_admin_or_editor(auth.uid()));

-- Annexes
DROP POLICY IF EXISTS "Admins can manage annexes" ON public.annexes;
DROP POLICY IF EXISTS "Anyone can read annexes" ON public.annexes;

CREATE POLICY "Anyone can read annexes" ON public.annexes
FOR SELECT USING (true);

CREATE POLICY "Admins can insert annexes" ON public.annexes
FOR INSERT TO authenticated WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update annexes" ON public.annexes
FOR UPDATE TO authenticated USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete annexes" ON public.annexes
FOR DELETE TO authenticated USING (is_admin_or_editor(auth.uid()));

-- Implementing Acts
DROP POLICY IF EXISTS "Admins can manage implementing_acts" ON public.implementing_acts;
DROP POLICY IF EXISTS "Anyone can read implementing_acts" ON public.implementing_acts;

CREATE POLICY "Anyone can read implementing_acts" ON public.implementing_acts
FOR SELECT USING (true);

CREATE POLICY "Admins can insert implementing_acts" ON public.implementing_acts
FOR INSERT TO authenticated WITH CHECK (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can update implementing_acts" ON public.implementing_acts
FOR UPDATE TO authenticated USING (is_admin_or_editor(auth.uid()));

CREATE POLICY "Admins can delete implementing_acts" ON public.implementing_acts
FOR DELETE TO authenticated USING (is_admin_or_editor(auth.uid()));
ALTER TABLE public.implementing_act_feedback ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;
GRANT SELECT ON public.implementing_act_feedback TO anon, authenticated;
GRANT ALL ON public.implementing_act_feedback TO service_role;
DROP POLICY IF EXISTS "Public can read act feedback" ON public.implementing_act_feedback;
CREATE POLICY "Public can read act feedback" ON public.implementing_act_feedback FOR SELECT TO anon, authenticated USING (true);

-- Add missing columns to implementing_acts (already exist in test, missing in live)
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS adoption_date DATE;
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS entry_into_force_date DATE;
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS date_of_effect DATE;
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS deliverable_name TEXT;

-- Add new feedback_link column
ALTER TABLE public.implementing_acts ADD COLUMN IF NOT EXISTS feedback_link TEXT;

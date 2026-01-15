-- Add themes array column to implementing_acts table
ALTER TABLE public.implementing_acts 
ADD COLUMN IF NOT EXISTS themes text[] DEFAULT '{}';

-- Migrate existing theme data to themes array
UPDATE public.implementing_acts 
SET themes = ARRAY[theme]
WHERE theme IS NOT NULL AND (themes IS NULL OR themes = '{}');

-- Add comment for documentation
COMMENT ON COLUMN public.implementing_acts.themes IS 'Array of theme categories this act belongs to';
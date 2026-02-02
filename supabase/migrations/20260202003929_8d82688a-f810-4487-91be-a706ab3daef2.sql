-- Add columns for auto-discovery tracking and user flagging
ALTER TABLE public.published_works 
ADD COLUMN IF NOT EXISTS is_auto_discovered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_reason text,
ADD COLUMN IF NOT EXISTS flagged_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS flagged_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS source_url text;

-- Create index for quick lookup of auto-discovered and flagged works
CREATE INDEX IF NOT EXISTS idx_published_works_auto_discovered ON public.published_works(is_auto_discovered);
CREATE INDEX IF NOT EXISTS idx_published_works_flagged ON public.published_works(is_flagged);

-- Comment for documentation
COMMENT ON COLUMN public.published_works.is_auto_discovered IS 'True if this work was automatically discovered by the Firecrawl search job';
COMMENT ON COLUMN public.published_works.is_flagged IS 'True if a user has flagged this work for review';
COMMENT ON COLUMN public.published_works.source_url IS 'The original source URL where this work was discovered';
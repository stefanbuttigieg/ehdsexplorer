-- Add stakeholder relevance tags to articles table
-- Stakeholders: citizen, healthcare, legal, researcher, developer, policy
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS stakeholder_tags text[] DEFAULT '{}';

-- Add stakeholder relevance tags to recitals table as well
ALTER TABLE public.recitals 
ADD COLUMN IF NOT EXISTS stakeholder_tags text[] DEFAULT '{}';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_articles_stakeholder_tags ON public.articles USING GIN(stakeholder_tags);
CREATE INDEX IF NOT EXISTS idx_recitals_stakeholder_tags ON public.recitals USING GIN(stakeholder_tags);

-- Add a column to track key provisions (highlighted for specific stakeholders)
ALTER TABLE public.articles 
ADD COLUMN IF NOT EXISTS is_key_provision boolean DEFAULT false;

-- Add stakeholder_filter preference to profiles for logged-in users
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stakeholder_filter text DEFAULT NULL;

-- Seed initial stakeholder tags for key articles based on EHDS structure
-- Chapter II (Primary Use) - Articles 3-14: Relevant to citizens, healthcare
UPDATE public.articles SET stakeholder_tags = ARRAY['citizen', 'healthcare'], is_key_provision = true 
WHERE article_number BETWEEN 3 AND 14;

-- Article 1-2 (Subject matter, Definitions): Relevant to all stakeholders
UPDATE public.articles SET stakeholder_tags = ARRAY['citizen', 'healthcare', 'legal', 'researcher', 'developer', 'policy']
WHERE article_number IN (1, 2);

-- Chapter III (EHR Systems) - Articles 15-32: Relevant to developers, healthcare
UPDATE public.articles SET stakeholder_tags = ARRAY['developer', 'healthcare', 'legal'], is_key_provision = true 
WHERE article_number BETWEEN 15 AND 32;

-- Chapter IV (Secondary Use) - Articles 33-50: Relevant to researchers, policy makers
UPDATE public.articles SET stakeholder_tags = ARRAY['researcher', 'policy', 'legal'], is_key_provision = true 
WHERE article_number BETWEEN 33 AND 50;

-- Article 51 (Opt-out): Key for citizens
UPDATE public.articles SET stakeholder_tags = ARRAY['citizen', 'legal', 'policy'], is_key_provision = true 
WHERE article_number = 51;

-- Chapter V-VI (Health Data Access Bodies, HealthData@EU) - Articles 52-68
UPDATE public.articles SET stakeholder_tags = ARRAY['researcher', 'policy', 'legal']
WHERE article_number BETWEEN 52 AND 68;

-- Chapter VII (Governance) - Articles 69-75
UPDATE public.articles SET stakeholder_tags = ARRAY['policy', 'legal']
WHERE article_number BETWEEN 69 AND 75;

-- Chapter VIII (Supervision) - Articles 76-86: Relevant to legal, policy
UPDATE public.articles SET stakeholder_tags = ARRAY['legal', 'policy']
WHERE article_number BETWEEN 76 AND 86;

-- Chapter IX (Penalties) - Articles 87-98: Relevant to legal, developers
UPDATE public.articles SET stakeholder_tags = ARRAY['legal', 'developer', 'healthcare']
WHERE article_number BETWEEN 87 AND 98;

-- Chapter X (Final Provisions) - Articles 99-105
UPDATE public.articles SET stakeholder_tags = ARRAY['legal', 'policy']
WHERE article_number BETWEEN 99 AND 105;

-- Seed recital tags (recitals follow similar structure)
-- Recitals 1-30: General intro, citizen focus
UPDATE public.recitals SET stakeholder_tags = ARRAY['citizen', 'healthcare', 'policy']
WHERE recital_number BETWEEN 1 AND 30;

-- Recitals 31-60: Technical, developer focus
UPDATE public.recitals SET stakeholder_tags = ARRAY['developer', 'healthcare', 'legal']
WHERE recital_number BETWEEN 31 AND 60;

-- Recitals 61-90: Secondary use, researcher focus
UPDATE public.recitals SET stakeholder_tags = ARRAY['researcher', 'policy', 'legal']
WHERE recital_number BETWEEN 61 AND 90;

-- Recitals 91-115: Governance, enforcement
UPDATE public.recitals SET stakeholder_tags = ARRAY['legal', 'policy']
WHERE recital_number BETWEEN 91 AND 115;
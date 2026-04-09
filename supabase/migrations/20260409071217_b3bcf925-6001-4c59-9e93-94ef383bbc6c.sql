
-- Add implementing act article/recital references to footnotes
ALTER TABLE public.footnotes
  ADD COLUMN implementing_act_article_id UUID REFERENCES public.implementing_act_articles(id) ON DELETE CASCADE,
  ADD COLUMN implementing_act_recital_id UUID REFERENCES public.implementing_act_recitals(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX idx_footnotes_ia_article_id ON public.footnotes(implementing_act_article_id);
CREATE INDEX idx_footnotes_ia_recital_id ON public.footnotes(implementing_act_recital_id);

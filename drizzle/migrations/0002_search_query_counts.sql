CREATE TABLE public.search_query_counts (
  query text PRIMARY KEY,
  search_count integer NOT NULL DEFAULT 0,
  last_searched_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.search_query_counts TO anon, authenticated;
GRANT ALL ON public.search_query_counts TO service_role;
ALTER TABLE public.search_query_counts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read search counts" ON public.search_query_counts FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.record_search_query(_query text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE q text := lower(btrim(regexp_replace(coalesce(_query,''), '\s+', ' ', 'g')));
BEGIN
  IF length(q) < 3 OR length(q) > 80 THEN RETURN; END IF;
  INSERT INTO public.search_query_counts(query, search_count, last_searched_at)
  VALUES (q, 1, now())
  ON CONFLICT (query) DO UPDATE SET search_count = search_query_counts.search_count + 1, last_searched_at = now();
END $$;
GRANT EXECUTE ON FUNCTION public.record_search_query(text) TO anon, authenticated;
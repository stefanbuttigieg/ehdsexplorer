CREATE OR REPLACE FUNCTION public.sync_committee_meetings(_updates jsonb, _scraped_at timestamptz) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; total integer; prefix constant text := 'https://ec.europa.eu/transparency/comitology-register/';
BEGIN
 IF jsonb_typeof(_updates) IS DISTINCT FROM 'array' OR jsonb_array_length(_updates)=0 OR _scraped_at IS NULL THEN RAISE EXCEPTION 'Complete nonempty meeting list required'; END IF;
 total := jsonb_array_length(_updates);
 FOR item IN SELECT value FROM jsonb_array_elements(_updates) LOOP
  IF coalesce(item->>'title','')='' OR coalesce(item->>'source_url','') NOT LIKE prefix || 'screen/meetings/%' OR coalesce(item->>'scraped_content','')='' THEN RAISE EXCEPTION 'Invalid committee meeting'; END IF;
 END LOOP;
 IF (SELECT count(DISTINCT value->>'source_url') FROM jsonb_array_elements(_updates))<>total THEN RAISE EXCEPTION 'Duplicate committee meeting'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('ehds-committee-cache',0));
 IF EXISTS(SELECT 1 FROM public.comitology_updates WHERE source_url LIKE prefix || 'screen/meetings/%' AND scraped_at>_scraped_at) THEN RAISE EXCEPTION 'A newer committee refresh already completed'; END IF;
 INSERT INTO public.comitology_updates(title,source_url,scraped_content,summary,scraped_at)
 SELECT value->>'title',value->>'source_url',value->>'scraped_content',value->>'summary',_scraped_at FROM jsonb_array_elements(_updates)
 ON CONFLICT(title) DO UPDATE SET source_url=excluded.source_url,scraped_content=excluded.scraped_content,summary=excluded.summary,scraped_at=excluded.scraped_at;
 DELETE FROM public.comitology_updates WHERE (source_url LIKE prefix || 'screen/meetings/%' OR source_url=prefix || 'screen/committees/C131500') AND scraped_at<_scraped_at;
 RETURN total;
END; $$;
REVOKE ALL ON FUNCTION public.sync_committee_meetings(jsonb,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_committee_meetings(jsonb,timestamptz) TO service_role;
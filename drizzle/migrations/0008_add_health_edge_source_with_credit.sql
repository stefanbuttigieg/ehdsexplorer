CREATE OR REPLACE FUNCTION public.publish_implementation_candidate(candidate_id uuid, automatic boolean DEFAULT true)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE c public.implementation_agent_candidates; s public.implementation_agent_sources; r public.country_obligation_status;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('implementation-agent-publish'));
 SELECT * INTO c FROM public.implementation_agent_candidates WHERE id=candidate_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
 IF c.state <> 'pending' THEN RETURN c.state; END IF;
 SELECT * INTO s FROM public.implementation_agent_sources WHERE id=c.source_id;
 IF automatic AND (NOT c.qualifies OR NOT s.official OR NOT (SELECT enabled AND auto_publish AND paused_reason IS NULL FROM public.implementation_agent_settings WHERE id=true)) THEN RETURN 'pending'; END IF;
 SELECT * INTO r FROM public.country_obligation_status WHERE country_code=c.country_code AND obligation_id=c.obligation_id FOR UPDATE;
 IF r.updated_at IS DISTINCT FROM c.expected_updated_at THEN UPDATE public.implementation_agent_candidates SET state='conflict',decided_at=now() WHERE id=c.id; RETURN 'conflict'; END IF;
 IF automatic AND array_position(ARRAY['not_started','in_progress','partial','completed'],c.proposed_status::text) <= array_position(ARRAY['not_started','in_progress','partial','completed'],coalesce(r.status::text,'not_started')) THEN RETURN 'pending'; END IF;
 INSERT INTO public.country_obligation_status(country_code,obligation_id,status,status_notes,evidence_url,last_verified_at)
 VALUES(c.country_code,c.obligation_id,c.proposed_status,concat_ws(E'\n\n',r.status_notes,'[Implementation agent] '||c.summary||' Evidence dated '||coalesce(c.evidence_date::text,'unknown')||'. Source: '||s.publisher||' ('||s.url||').'),s.url,now())
 ON CONFLICT(country_code,obligation_id) DO UPDATE SET status=excluded.status,status_notes=excluded.status_notes,evidence_url=excluded.evidence_url,last_verified_at=excluded.last_verified_at,updated_at=now();
 INSERT INTO public.obligation_evidence(country_code,obligation_id,evidence_type,title,description,url) VALUES(c.country_code,c.obligation_id,'link','Automated EHDS evidence — '||s.publisher,c.summary||E'\n\n'||c.evidence_quote||E'\n\nCredit: '||s.publisher||', '||s.url,s.url);
 UPDATE public.implementation_agent_candidates SET state='published',decided_at=now() WHERE id=c.id; RETURN 'published';
END $function$;
INSERT INTO public.implementation_agent_sources(url,publisher,official) VALUES('https://thehealthedge.eu/','The Health Edge (thehealthedge.eu) — research insights',false) ON CONFLICT(url) DO NOTHING;
CREATE TABLE public.implementation_agent_settings (id boolean PRIMARY KEY DEFAULT true CHECK(id), enabled boolean NOT NULL DEFAULT true, auto_publish boolean NOT NULL DEFAULT true, paused_reason text, cron_token text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'));
GRANT ALL ON public.implementation_agent_settings TO service_role;
ALTER TABLE public.implementation_agent_settings ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.implementation_agent_sources (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), url text UNIQUE NOT NULL, publisher text NOT NULL, country_code text, official boolean NOT NULL DEFAULT false, enabled boolean NOT NULL DEFAULT true, content_hash text, last_checked_at timestamptz, last_error text);
GRANT SELECT ON public.implementation_agent_sources TO authenticated; GRANT ALL ON public.implementation_agent_sources TO service_role;
ALTER TABLE public.implementation_agent_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_sources_admin_read ON public.implementation_agent_sources FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TABLE public.implementation_agent_runs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid REFERENCES public.implementation_agent_sources(id), started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz, status text NOT NULL DEFAULT 'running' CHECK(status IN ('running','completed','failed','unchanged')), candidates integer NOT NULL DEFAULT 0, published integer NOT NULL DEFAULT 0, error text);
GRANT SELECT ON public.implementation_agent_runs TO authenticated; GRANT ALL ON public.implementation_agent_runs TO service_role;
ALTER TABLE public.implementation_agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_runs_admin_read ON public.implementation_agent_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TABLE public.implementation_agent_candidates (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_id uuid NOT NULL REFERENCES public.implementation_agent_sources(id), country_code text NOT NULL, obligation_id text NOT NULL REFERENCES public.ehds_obligations(id), proposed_status public.obligation_status NOT NULL, summary text NOT NULL, evidence_quote text NOT NULL, evidence_date date, confidence numeric NOT NULL, qualifies boolean NOT NULL DEFAULT false, reason text NOT NULL, fingerprint text UNIQUE NOT NULL, expected_updated_at timestamptz, state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','published','dismissed','conflict')), created_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz);
GRANT SELECT ON public.implementation_agent_candidates TO authenticated; GRANT ALL ON public.implementation_agent_candidates TO service_role;
ALTER TABLE public.implementation_agent_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_candidates_admin_read ON public.implementation_agent_candidates FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE OR REPLACE FUNCTION public.publish_implementation_candidate(candidate_id uuid, automatic boolean DEFAULT true) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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
 VALUES(c.country_code,c.obligation_id,c.proposed_status,concat_ws(E'\n\n',r.status_notes,'[Implementation agent] '||c.summary||' Evidence dated '||coalesce(c.evidence_date::text,'unknown')||'.'),s.url,now())
 ON CONFLICT(country_code,obligation_id) DO UPDATE SET status=excluded.status,status_notes=excluded.status_notes,evidence_url=excluded.evidence_url,last_verified_at=excluded.last_verified_at,updated_at=now();
 INSERT INTO public.obligation_evidence(country_code,obligation_id,evidence_type,title,description,url) VALUES(c.country_code,c.obligation_id,'link','Automated EHDS evidence — '||s.publisher,c.summary||E'\n\n'||c.evidence_quote,s.url);
 UPDATE public.implementation_agent_candidates SET state='published',decided_at=now() WHERE id=c.id; RETURN 'published';
END $$;
REVOKE ALL ON FUNCTION public.publish_implementation_candidate(uuid,boolean) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.publish_implementation_candidate(uuid,boolean) TO service_role;
CREATE TABLE public.mfa_email_challenges (user_id uuid NOT NULL, session_id uuid NOT NULL, purpose text NOT NULL CHECK (purpose IN ('login','enroll','disable')), code_hash text NOT NULL, expires_at timestamptz NOT NULL, sent_at timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 0, PRIMARY KEY(user_id,session_id,purpose));
GRANT ALL ON public.mfa_email_challenges TO service_role;
ALTER TABLE public.mfa_email_challenges ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.mfa_verified_sessions (user_id uuid NOT NULL, session_id uuid NOT NULL, verified_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,session_id));
GRANT ALL ON public.mfa_verified_sessions TO service_role;
ALTER TABLE public.mfa_verified_sessions ENABLE ROW LEVEL SECURITY;
COMMENT ON COLUMN public.user_mfa_preferences.email_otp_code IS 'DEPRECATED: codes now live in service-only session-bound challenges';
COMMENT ON COLUMN public.user_mfa_preferences.email_otp_expires_at IS 'DEPRECATED: expiry now lives in service-only session-bound challenges';
REVOKE ALL ON public.user_mfa_preferences FROM anon, authenticated;
GRANT SELECT(id,user_id,reminder_dismissed_at,reminder_snooze_until,preferred_method,email_otp_enabled,created_at,updated_at) ON public.user_mfa_preferences TO authenticated;
GRANT INSERT(user_id,reminder_dismissed_at,reminder_snooze_until,preferred_method,updated_at), UPDATE(reminder_dismissed_at,reminder_snooze_until,preferred_method,updated_at) ON public.user_mfa_preferences TO authenticated;
GRANT ALL ON public.user_mfa_preferences TO service_role;
CREATE OR REPLACE FUNCTION public.is_mfa_session_verified() RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid(); sid uuid; requires_mfa boolean;
BEGIN
 IF uid IS NULL THEN RETURN false; END IF;
 IF auth.jwt()->>'aal'='aal2' THEN RETURN true; END IF;
 sid := nullif(auth.jwt()->>'session_id','')::uuid;
 SELECT EXISTS(SELECT 1 FROM public.user_mfa_preferences WHERE user_id=uid AND email_otp_enabled=true) OR EXISTS(SELECT 1 FROM auth.mfa_factors WHERE user_id=uid AND status='verified') OR EXISTS(SELECT 1 FROM public.mfa_settings WHERE enforcement_enabled AND (enforcement_start_date IS NULL OR enforcement_start_date<=now()) AND (grace_period_end_date IS NULL OR grace_period_end_date<=now())) INTO requires_mfa;
 IF NOT requires_mfa THEN RETURN true; END IF;
 RETURN sid IS NOT NULL AND EXISTS(SELECT 1 FROM public.mfa_verified_sessions WHERE user_id=uid AND session_id=sid);
END; $$;
REVOKE ALL ON FUNCTION public.is_mfa_session_verified() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_mfa_session_verified() TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.issue_mfa_email_challenge(_user_id uuid,_session_id uuid,_purpose text,_code_hash text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE wait_seconds integer;
BEGIN
 IF _purpose NOT IN ('login','enroll','disable') OR _code_hash !~ '^[a-f0-9]{64}$' THEN RAISE EXCEPTION 'Invalid challenge'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(_user_id::text,0));
 SELECT greatest(0,ceil(extract(epoch FROM (max(sent_at)+interval '30 seconds'-now())))::integer) INTO wait_seconds FROM public.mfa_email_challenges WHERE user_id=_user_id;
 IF coalesce(wait_seconds,0)>0 THEN RETURN wait_seconds; END IF;
 INSERT INTO public.mfa_email_challenges(user_id,session_id,purpose,code_hash,expires_at,sent_at,attempts) VALUES(_user_id,_session_id,_purpose,_code_hash,now()+interval '10 minutes',now(),0) ON CONFLICT(user_id,session_id,purpose) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,sent_at=excluded.sent_at,attempts=0;
 RETURN 0;
END; $$;
REVOKE ALL ON FUNCTION public.issue_mfa_email_challenge(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.issue_mfa_email_challenge(uuid,uuid,text,text) TO service_role;
CREATE OR REPLACE FUNCTION public.consume_mfa_email_challenge(_user_id uuid,_session_id uuid,_purpose text,_code_hash text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.mfa_email_challenges%ROWTYPE;
BEGIN
 SELECT * INTO c FROM public.mfa_email_challenges WHERE user_id=_user_id AND session_id=_session_id AND purpose=_purpose FOR UPDATE;
 IF NOT FOUND OR c.expires_at<=now() THEN RETURN 'expired'; END IF;
 IF c.attempts>=5 THEN RETURN 'locked'; END IF;
 IF c.code_hash<>_code_hash THEN UPDATE public.mfa_email_challenges SET attempts=attempts+1 WHERE user_id=_user_id AND session_id=_session_id AND purpose=_purpose; RETURN 'invalid'; END IF;
 UPDATE public.mfa_email_challenges SET expires_at=now(),attempts=5 WHERE user_id=_user_id AND session_id=_session_id AND purpose=_purpose;
 IF _purpose='enroll' THEN INSERT INTO public.user_mfa_preferences(user_id,email_otp_enabled) VALUES(_user_id,true) ON CONFLICT(user_id) DO UPDATE SET email_otp_enabled=true,updated_at=now();
 ELSIF _purpose='disable' THEN UPDATE public.user_mfa_preferences SET email_otp_enabled=false,updated_at=now() WHERE user_id=_user_id;
 END IF;
 INSERT INTO public.mfa_verified_sessions(user_id,session_id) VALUES(_user_id,_session_id) ON CONFLICT(user_id,session_id) DO UPDATE SET verified_at=now();
 RETURN 'verified';
END; $$;
REVOKE ALL ON FUNCTION public.consume_mfa_email_challenge(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.consume_mfa_email_challenge(uuid,uuid,text,text) TO service_role;
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND rowsecurity AND tablename NOT IN ('user_mfa_preferences','mfa_settings','mfa_email_challenges','mfa_verified_sessions') LOOP
  EXECUTE format('CREATE POLICY mfa_verified_writes ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.is_mfa_session_verified())',t.tablename);
  EXECUTE format('CREATE POLICY mfa_verified_updates ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.is_mfa_session_verified()) WITH CHECK (public.is_mfa_session_verified())',t.tablename);
  EXECUTE format('CREATE POLICY mfa_verified_deletes ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated USING (public.is_mfa_session_verified())',t.tablename);
  IF t.tablename NOT IN ('profiles','user_roles') AND NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t.tablename AND cmd IN ('SELECT','ALL') AND ('anon'=ANY(roles) OR 'public'=ANY(roles))) THEN
   EXECUTE format('CREATE POLICY mfa_verified_reads ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (public.is_mfa_session_verified())',t.tablename);
  END IF;
 END LOOP;
END; $$;
CREATE POLICY mfa_verified_settings_insert ON public.mfa_settings AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_mfa_session_verified());
CREATE POLICY mfa_verified_settings_update ON public.mfa_settings AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_mfa_session_verified()) WITH CHECK(public.is_mfa_session_verified());
CREATE POLICY mfa_verified_settings_delete ON public.mfa_settings AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_mfa_session_verified());
CREATE POLICY mfa_verified_storage_insert ON storage.objects AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_mfa_session_verified());
CREATE POLICY mfa_verified_storage_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO authenticated USING(public.is_mfa_session_verified()) WITH CHECK(public.is_mfa_session_verified());
CREATE POLICY mfa_verified_storage_delete ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING(public.is_mfa_session_verified());
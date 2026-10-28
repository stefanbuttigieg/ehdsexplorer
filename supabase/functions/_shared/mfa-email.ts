import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { codeDigest, generateCode, sessionIdFromClaims } from './mfa-policy.ts';

const schema = z.object({ action: z.enum(['send', 'verify']).default('verify'), purpose: z.enum(['login', 'enroll', 'disable']).default('enroll'), code: z.string().regex(/^\d{6}$/).optional() });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function handleEmailMfa(req: Request, loginOnly = false) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return response({ error: 'Method not allowed' }, 405);
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return response({ error: 'Unauthorized' }, 401);
    const url = Deno.env.get('SUPABASE_URL') ?? '';
    const client = createClient(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: `Bearer ${token}` } } });
    const { data: auth, error: authError } = await client.auth.getUser(token);
    const { data: claimsData, error: claimsError } = await client.auth.getClaims(token);
    const sid = claimsData?.claims ? sessionIdFromClaims(claimsData.claims) : null;
    if (authError || claimsError || !auth.user?.email || !sid) return response({ error: 'Please sign in again' }, 401);
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return response({ error: 'Enter a six-digit verification code' }, 400);
    const { action, code } = parsed.data;
    const purpose = loginOnly ? 'login' : parsed.data.purpose;
    const key = Deno.env.get('MFA_EMAIL_CODE_KEY');
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (!key || !resendKey) return response({ error: 'Verification is temporarily unavailable' }, 503);
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { data: prefs, error: prefsError } = await admin.from('user_mfa_preferences').select('email_otp_enabled').eq('user_id', auth.user.id).maybeSingle();
    const { data: settings, error: settingsError } = await admin.from('mfa_settings').select('allowed_methods').single();
    if (prefsError || settingsError) return response({ error: 'Unable to check verification settings' }, 503);
    if (purpose !== 'disable' && !settings.allowed_methods?.includes('email')) return response({ error: 'Email verification is not available. Use your authenticator app.' }, 403);
    if (purpose !== 'enroll' && !prefs?.email_otp_enabled) return response({ error: 'Email verification is not enabled' }, 403);
    if (purpose === 'enroll' && prefs?.email_otp_enabled) return response({ error: 'Email verification is already enabled. Complete sign-in verification instead.' }, 409);
    if (purpose === 'enroll') {
      const { data: factors, error } = await client.auth.mfa.listFactors();
      const { data: verified, error: verifiedError } = await client.rpc('is_mfa_session_verified');
      if (error || verifiedError) return response({ error: 'Unable to check verification status' }, 503);
      if (factors.totp.some(f => f.status === 'verified') && verified !== true) return response({ error: 'Verify your authenticator before adding email verification' }, 403);
    }
    if (action === 'send') {
      const otp = generateCode();
      const hash = await codeDigest(key, auth.user.id, sid, purpose, otp);
      const { data: retryAfter, error } = await admin.rpc('issue_mfa_email_challenge', { _user_id: auth.user.id, _session_id: sid, _purpose: purpose, _code_hash: hash });
      if (error) return response({ error: 'Unable to create verification code' }, 503);
      if (retryAfter > 0) return response({ error: `Please wait ${retryAfter} seconds before requesting another code`, retryAfter }, 429);
      const delivered = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'EHDS Explorer <noreply@ehdsexplorer.eu>', to: [auth.user.email], subject: 'Your EHDS Explorer verification code', html: `<h1>Verification code</h1><p>Your code is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes. Use the latest code only. If you did not request it, do not share it.</p>` }) });
      if (!delivered.ok) {
        await admin.from('mfa_email_challenges').update({ expires_at: new Date().toISOString() }).eq('user_id', auth.user.id).eq('session_id', sid).eq('purpose', purpose).eq('code_hash', hash);
        return response({ error: 'Unable to send the code. Please wait 30 seconds and try again.' }, 502);
      }
      return response({ success: true, retryAfter: 30 });
    }
    if (!code) return response({ error: 'Enter a six-digit verification code' }, 400);
    const hash = await codeDigest(key, auth.user.id, sid, purpose, code);
    const { data: result, error } = await admin.rpc('consume_mfa_email_challenge', { _user_id: auth.user.id, _session_id: sid, _purpose: purpose, _code_hash: hash });
    if (error) return response({ error: 'Unable to complete verification' }, 503);
    if (result !== 'verified') return response({ error: result === 'locked' ? 'Too many attempts. Request a new code.' : result === 'expired' ? 'Code expired or already used. Request a new code.' : 'Invalid verification code' }, result === 'locked' ? 429 : 400);
    return response({ success: true });
  } catch {
    return response({ error: 'Verification is temporarily unavailable' }, 503);
  }
}
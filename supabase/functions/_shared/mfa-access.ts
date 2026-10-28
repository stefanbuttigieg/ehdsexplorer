import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

export async function requireVerifiedSession(req: Request): Promise<Response | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  const deny = () => new Response(JSON.stringify({ error: 'Complete two-step verification before continuing', code: 'MFA_REQUIRED' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  if (!token) return deny();
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: user, error: authError } = await client.auth.getUser(token);
  if (authError || !user.user) return deny();
  const { data: verified, error } = await client.rpc('is_mfa_session_verified');
  return error || verified !== true ? deny() : null;
}
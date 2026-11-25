import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const reply = (error: string, status: number) =>
  new Response(JSON.stringify({ error }), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const serviceClient = () =>
  createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

/** True when the request carries the private scheduler token (service-only setting). */
export async function isScheduledCall(req: Request): Promise<boolean> {
  const given = req.headers.get('x-cron-token');
  if (!given) return false;
  const { data } = await serviceClient().from('implementation_agent_settings').select('cron_token').eq('id', true).maybeSingle();
  return !!data?.cron_token && data.cron_token === given;
}

/** Returns the signed-in user's id, or a 401 response. */
export async function requireUser(req: Request): Promise<{ userId: string } | Response> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply('Sign in required', 401);
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return reply('Sign in required', 401);
  return { userId: data.user.id };
}

/**
 * Allows only verified admins/editors (or super admins when `superAdminOnly`),
 * optionally also the private scheduler. Returns null when allowed.
 */
export async function requireStaff(req: Request, opts: { allowCron?: boolean; adminOnly?: boolean } = {}): Promise<Response | null> {
  if (opts.allowCron && await isScheduledCall(req)) return null;
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return reply('Sign in required', 401);
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (serviceKey && token === serviceKey) return null; // internal function-to-function call
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return reply('Sign in required', 401);
  const uid = data.user.id;
  // Called with the user's own token so the server-side two-step verification check applies.
  const checks = opts.adminOnly
    ? [client.rpc('has_role', { _user_id: uid, _role: 'admin' }), client.rpc('has_role', { _user_id: uid, _role: 'super_admin' })]
    : [client.rpc('is_admin_or_editor', { _user_id: uid })];
  const results = await Promise.all(checks);
  return results.some((r) => r.data === true) ? null : reply('Forbidden', 403);
}

/** Masks an email address for diagnostics: j***@example.org */
export function maskEmail(email: unknown): string {
  const s = String(email ?? '');
  const at = s.indexOf('@');
  return at > 0 ? `${s[0]}***${s.slice(at)}` : '***';
}

/** Escapes text for safe inclusion in HTML email bodies. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

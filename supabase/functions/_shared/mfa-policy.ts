export const CODE_PATTERN = /^\d{6}$/;
export const RESEND_SECONDS = 30;
export const MAX_ATTEMPTS = 5;

export function requiresVerification(emailEnabled: boolean, hasTotp: boolean, enforced: boolean) {
  return emailEnabled || hasTotp || enforced;
}

export function sessionIdFromClaims(claims: Record<string, unknown>): string | null {
  const value = claims.session_id;
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export function generateCode(): string {
  const bytes = new Uint32Array(1);
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= 4294000000);
  return (bytes[0] % 1000000).toString().padStart(6, '0');
}

export async function codeDigest(key: string, userId: string, sessionId: string, purpose: string, code: string) {
  const encoder = new TextEncoder();
  const signingKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC', signingKey, encoder.encode(JSON.stringify([userId, sessionId, purpose, code])));
  return Array.from(new Uint8Array(signed), b => b.toString(16).padStart(2, '0')).join('');
}
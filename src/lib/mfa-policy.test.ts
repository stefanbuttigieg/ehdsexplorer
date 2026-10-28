import { describe, test, expect } from 'bun:test';
import { CODE_PATTERN, RESEND_SECONDS, MAX_ATTEMPTS, sessionIdFromClaims, requiresVerification, codeDigest, generateCode } from '../../supabase/functions/_shared/mfa-policy';

describe('two-step authentication', () => {
  test('email remains an alternative requiring server verification', () => {
    expect(requiresVerification(true, false, false)).toBe(true);
  });
  test('authenticator requires server verification independently of email', () => {
    expect(requiresVerification(false, true, false)).toBe(true);
  });
  test('enforced verification applies without enrolled methods', () => {
    expect(requiresVerification(false, false, true)).toBe(true);
    expect(requiresVerification(false, false, false)).toBe(false);
  });
  test('resend cooldown stays thirty seconds', () => {
    expect(RESEND_SECONDS).toBe(30);
  });
  test('guessing stops after five attempts', () => {
    expect(MAX_ATTEMPTS).toBe(5);
  });
  test('codes must contain exactly six digits', () => {
    expect(CODE_PATTERN.test('123456')).toBe(true);
    expect(CODE_PATTERN.test('abcdef')).toBe(false);
    expect(CODE_PATTERN.test('12345')).toBe(false);
  });
  test('sessions cannot be identified by browser flags', () => {
    expect(sessionIdFromClaims({ verified: true })).toBeNull();
    expect(sessionIdFromClaims({ session_id: 'malformed' })).toBeNull();
    expect(sessionIdFromClaims({ session_id: '12345678-1234-1234-1234-123456789abc' })).toBe('12345678-1234-1234-1234-123456789abc');
  });
  test('email proofs are bound to user, session and purpose', async () => {
    const digest = await codeDigest('test-only-key', 'user-a', 'session-a', 'login', '123456');
    expect(await codeDigest('test-only-key', 'user-a', 'session-a', 'login', '123456')).toBe(digest);
    expect(await codeDigest('test-only-key', 'user-a', 'session-b', 'login', '123456')).not.toBe(digest);
    expect(await codeDigest('test-only-key', 'user-b', 'session-a', 'login', '123456')).not.toBe(digest);
    expect(await codeDigest('test-only-key', 'user-a', 'session-a', 'disable', '123456')).not.toBe(digest);
  });
  test('cryptographic codes preserve six digits including leading zeroes', () => {
    for (let i = 0; i < 100; i++) expect(CODE_PATTERN.test(generateCode())).toBe(true);
  });
});
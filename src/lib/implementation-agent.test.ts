// @ts-ignore Bun runs this focused test; browser dependencies omit Bun types.
import { describe, expect, test } from 'bun:test';
import { assessEvidence } from '../../supabase/functions/implementation-agent/policy';
const quote = 'Finland is implementing EHDS through a dedicated national programme.';
const candidate = { country_code: 'FI', evidence_quote: quote, evidence_date: '2026-10-01', confidence: 0.98, explicitly_ehds: true, obligation_specific: true, proposed_status: 'in_progress', operational: false };
const source = { official: true, country_code: 'FI' };
const check = (s = source, c = candidate, text = quote) => assessEvidence(s, c, text, new Date('2026-10-28'));
describe('automatic country updates', () => {
  test('verified official evidence qualifies for automatic publishing', () => expect(check()).toBe('Verified official country evidence'));
  test('research websites cannot publish uncorroborated claims', () => expect(check({ ...source, official: false })).not.toBe('Verified official country evidence'));
  test('uncertain evidence remains pending', () => expect(check(source, { ...candidate, confidence: 0.7 })).toBe('Insufficient confidence'));
  test('missing quotations cannot publish', () => expect(check(source, candidate, 'Other content')).toBe('Exact supporting passage not found'));
  test('EU-wide claims cannot set country progress', () => expect(check({ ...source, country_code: null })).toBe('Country-specific official source required'));
  test('old evidence cannot update current progress', () => expect(check(source, { ...candidate, evidence_date: '2023-01-01' })).toBe('Recent dated evidence required'));
  test('completion needs operational evidence', () => expect(check(source, { ...candidate, proposed_status: 'completed' })).toBe('Completion requires operational evidence'));
});
import { describe, it, expect } from 'vitest';
import { BETA_DEFAULT_KEY, BETA_TRIAL_KEY, classicDestination, readBetaChoice, shouldUseBeta, writeBetaChoice } from './beta-experience';

const store = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => { data.set(k, v); }, removeItem: (k: string) => { data.delete(k); } };
};
describe('optional beta choices', () => {
  it('trying only sets the tab-local trial, never browser adoption', () => {
    const persistent = store(), session = store();
    writeBetaChoice(session, BETA_TRIAL_KEY, true);
    expect(readBetaChoice(session, BETA_TRIAL_KEY)).toBe(true);
    expect(readBetaChoice(persistent, BETA_DEFAULT_KEY)).toBe(false);
    expect(shouldUseBeta('/article/5', false, true, false)).toBe(true);
  });
  it('explicit adoption survives a fresh tab', () => {
    const persistent = store();
    writeBetaChoice(persistent, BETA_DEFAULT_KEY, true);
    expect(shouldUseBeta('/', false, false, readBetaChoice(persistent, BETA_DEFAULT_KEY))).toBe(true);
  });
  it('reversal clears both choices and preserves a legal deep link', () => {
    const persistent = store(), session = store();
    writeBetaChoice(persistent, BETA_DEFAULT_KEY, true);
    writeBetaChoice(session, BETA_TRIAL_KEY, true);
    writeBetaChoice(persistent, BETA_DEFAULT_KEY, false);
    writeBetaChoice(session, BETA_TRIAL_KEY, false);
    expect(shouldUseBeta('/article/5', false, readBetaChoice(session, BETA_TRIAL_KEY), readBetaChoice(persistent, BETA_DEFAULT_KEY))).toBe(false);
    expect(classicDestination('/article/5', '?highlight=health', '#paragraph-2')).toBe('/article/5?highlight=health#paragraph-2');
  });
  it.each(['/admin', '/admin/auth', '/admin/seo', '/profile', '/my-countries', '/.lovable/oauth/consent', '/kids'])('does not override protected or kids screen %s', (path) => {
    expect(shouldUseBeta(path, false, true, true)).toBe(false);
  });
  it('never overrides Kids Mode, even at the shared entry', () => {
    expect(shouldUseBeta('/beta', true, true, true)).toBe(false);
    expect(shouldUseBeta('/', true, true, true)).toBe(false);
  });
  it('uses the shared entry without adoption and returns to search without a redirect loop', () => {
    expect(shouldUseBeta('/beta', false, false, false)).toBe(true);
    expect(classicDestination('/beta', '?q=Article+5', '')).toBe('/search?q=Article+5');
    expect(shouldUseBeta('/search', false, false, false)).toBe(false);
    expect(classicDestination('/beta', '', '')).toBe('/');
  });
  it('fails safely if browser storage is blocked', () => {
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    expect(readBetaChoice(blocked, BETA_DEFAULT_KEY)).toBe(false);
    expect(writeBetaChoice(blocked, BETA_DEFAULT_KEY, true)).toBe(false);
  });
});
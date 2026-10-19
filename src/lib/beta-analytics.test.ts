import { describe, expect, it } from 'vitest';
import { betaEventName, canTrackBeta } from './beta-analytics';

describe('lightweight beta counts', () => {
  it('distinguishes trials from adoption and reversal', () => {
    expect(betaEventName('trial')).toBe('beta_trial_started');
    expect(betaEventName('adopted')).toBe('beta_default_adopted');
    expect(betaEventName('returned_to_classic')).toBe('beta_returned_to_classic');
    expect(betaEventName('unknown')).toBeNull();
  });
  it('requires consent and an initialized existing tracker', () => {
    expect(canTrackBeta(true, true, 'ehdsexplorer.eu', false)).toBe(true);
    expect(canTrackBeta(false, true, 'ehdsexplorer.eu', false)).toBe(false);
    expect(canTrackBeta(true, false, 'ehdsexplorer.eu', false)).toBe(false);
  });
  it('excludes draft, local, and embedded review activity', () => {
    expect(canTrackBeta(true, true, 'localhost', false)).toBe(false);
    expect(canTrackBeta(true, true, 'id-preview--example.lovable.app', false)).toBe(false);
    expect(canTrackBeta(true, true, 'ehdsexplorer.eu', true)).toBe(false);
  });
});
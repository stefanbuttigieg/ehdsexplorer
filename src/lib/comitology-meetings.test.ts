import { describe, expect, it } from 'vitest';
import { MEETING_PREVIEW_LIMIT, newestMeetings, isMeetingCacheStale } from './comitology-meetings';

const row = (number: number, date: string) => ({ scraped_content: JSON.stringify({ meeting_code: `CMTD(2026)${number}`, title: `${number}th meeting`, date, committee: 'EHDS', url: 'https://ec.europa.eu/' }) });

describe('committee meeting preview', () => {
  it('keeps the newest saved copy of each meeting regardless of input order', () => {
    const old = { ...row(1, '15 June 2025'), scraped_at: '2026-10-28T00:00:00Z' };
    const fresh = { ...row(1, '16 June 2025'), scraped_at: '2026-10-30T00:00:00Z' };
    expect(newestMeetings([fresh, old])[0].date).toBe('16 June 2025');
    expect(newestMeetings([old, fresh])[0].date).toBe('16 June 2025');
  });
  it('does not refresh again just because an older row remains', () => {
    expect(isMeetingCacheStale([
      { ...row(1, '15 June 2025'), scraped_at: '2026-10-28T00:00:00Z' },
      { ...row(2, '16 June 2025'), scraped_at: '2026-10-30T09:00:00Z' },
    ], Date.parse('2026-10-30T15:00:00Z'))).toBe(false);
  });
  it('refreshes empty caches and caches older than 24 hours', () => {
    const now = Date.parse('2026-10-30T15:00:00Z');
    expect(isMeetingCacheStale([], now)).toBe(true);
    expect(isMeetingCacheStale([{ ...row(1, '15 June 2025'), scraped_at: '2026-10-29T14:59:59Z' }], now)).toBe(true);
  });
  it('shows five meetings rather than truncating the source to ten', () => {
    const rows = Array.from({ length: 11 }, (_, i) => row(i + 1, 'TBD'));
    expect(newestMeetings(rows).slice(0, MEETING_PREVIEW_LIMIT).map(m => m.title)).toEqual(['11th meeting', '10th meeting', '9th meeting', '8th meeting', '7th meeting']);
  });
  it('sorts by meeting date, not the order cached rows were created', () => {
    expect(newestMeetings([row(1, '15 June 2025'), row(11, '19 October 2026'), row(9, '22 June 2026')]).map(m => m.title)).toEqual(['11th meeting', '9th meeting', '1th meeting']);
  });
  it('counts distinct meetings rather than inferring totals from meeting numbers', () => {
    const rows = Array.from({ length: 10 }, (_, i) => row(i === 9 ? 11 : i + 1, 'TBD'));
    expect(newestMeetings([...rows, rows[0], { scraped_content: 'invalid' }])).toHaveLength(10);
  });
});
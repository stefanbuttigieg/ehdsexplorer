import { describe, expect, it } from 'vitest';
import { MEETING_PREVIEW_LIMIT, newestMeetings } from './comitology-meetings';

const row = (number: number, date: string) => ({ scraped_content: JSON.stringify({ meeting_code: `CMTD(2026)${number}`, title: `${number}th meeting`, date, committee: 'EHDS', url: 'https://ec.europa.eu/' }) });

describe('committee meeting preview', () => {
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
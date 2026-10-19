import { expect, it } from 'vitest';
import { fetchCommitteeMeetings } from '../../supabase/functions/scrape-comitology/meetings';

it('fetches later pages so the 11th meeting is included in a ten-record feed', async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async (url) => {
    calls.push(String(url));
    const page = new URL(String(url)).searchParams.get('page');
    const first = Array.from({ length: 9 }, (_, i) => ({ code: `CMTD(2026)${i + 1}`, startDate: '2026-06-22T22:00:00Z', meetingTitles: [{ language: 'EN', title: `${i + 1}th meeting` }] }));
    return new Response(JSON.stringify({ totalPages: 2, totalElements: 10, content: page === '0' ? first : [{ code: 'CMTD(2026)1615', startDate: '2026-10-21T22:00:00Z', meetingTitles: [{ language: 'EN', title: '11th meeting' }] }] }));
  };
  const meetings = await fetchCommitteeMeetings(fetcher);
  expect(calls).toHaveLength(2);
  expect(meetings).toHaveLength(10);
  expect(meetings[0].title).toBe('11th meeting');
  expect(meetings[0].date).toBe('22 October 2026');
});

it('rejects incomplete feeds rather than treating partial retrieval as success', async () => {
  const fetcher: typeof fetch = async () => new Response(JSON.stringify({ totalPages: 1, totalElements: 10, content: [] }));
  await expect(fetchCommitteeMeetings(fetcher)).rejects.toThrow('Incomplete committee meeting list');
});
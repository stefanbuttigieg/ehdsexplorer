export interface ComitologyMeeting {
  meeting_code: string;
  title: string;
  date: string;
  committee: string;
  url: string;
}

export const MEETING_PREVIEW_LIMIT = 5;

export interface MeetingCacheRow {
  scraped_content: string | null;
  scraped_at?: string;
}

export function isMeetingCacheStale(updates: MeetingCacheRow[], now = Date.now()): boolean {
  const latest = Math.max(...updates.map(u => Date.parse(u.scraped_at ?? '')).filter(Number.isFinite));
  return !Number.isFinite(latest) || latest < now - 24 * 60 * 60 * 1000;
}

export function newestMeetings(updates: MeetingCacheRow[]): ComitologyMeeting[] {
  const meetings = new Map<string, ComitologyMeeting>();
  // Compare cache times explicitly so caller order cannot choose an older duplicate.
  const ordered = [...updates].sort((a, b) => (Date.parse(b.scraped_at ?? '') || 0) - (Date.parse(a.scraped_at ?? '') || 0));
  for (const update of ordered) {
    try {
      const meeting = JSON.parse(update.scraped_content || '{}');
      if (typeof meeting.meeting_code !== 'string' || typeof meeting.title !== 'string' || typeof meeting.date !== 'string' || typeof meeting.url !== 'string') continue;
      if (!meetings.has(meeting.meeting_code)) meetings.set(meeting.meeting_code, meeting);
    } catch {
      // Ignore malformed cached rows.
    }
  }
  return [...meetings.values()].sort((a, b) => {
    const aDate = Date.parse(a.date);
    const bDate = Date.parse(b.date);
    if (Number.isFinite(aDate) && Number.isFinite(bDate) && aDate !== bDate) return bDate - aDate;
    const number = (title: string) => Number(title.match(/^(\d+)/)?.[1] || 0);
    return number(b.title) - number(a.title);
  });
}
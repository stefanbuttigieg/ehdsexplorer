export interface ComitologyMeeting {
  meeting_code: string;
  title: string;
  date: string;
  committee: string;
  url: string;
}

export const MEETING_PREVIEW_LIMIT = 5;

export function newestMeetings(updates: { scraped_content: string | null }[]): ComitologyMeeting[] {
  const meetings = new Map<string, ComitologyMeeting>();
  for (const update of updates) {
    try {
      const meeting = JSON.parse(update.scraped_content || '{}');
      if (typeof meeting.meeting_code !== 'string' || typeof meeting.title !== 'string' || typeof meeting.date !== 'string' || typeof meeting.url !== 'string') continue;
      meetings.set(meeting.meeting_code, meeting);
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
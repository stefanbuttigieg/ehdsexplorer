interface RegisterMeeting {
  code: string;
  startDate: string;
  meetingTitles: { language: string; title: string }[];
}
interface MeetingPage {
  content: RegisterMeeting[];
  totalPages: number;
  totalElements: number;
}
const endpoint = 'https://ec.europa.eu/transparency/comitology-register/core/api/front/committees/C131500/meetings';

export async function fetchCommitteeMeetings(fetcher: typeof fetch = fetch) {
  const records = new Map<string, RegisterMeeting>();
  let totalPages = 1;
  let total = 0;
  for (let page = 0; page < totalPages; page++) {
    const response = await fetcher(`${endpoint}?page=${page}&size=100`, {
      headers: { Accept: 'application/json', 'Accept-Encoding': 'identity' },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Committee register returned ${response.status}`);
    const data: MeetingPage = await response.json();
    if (!Array.isArray(data.content) || !Number.isInteger(data.totalPages) || data.totalPages > 100 || !Number.isInteger(data.totalElements)) {
      throw new Error('Invalid committee register response');
    }
    totalPages = data.totalPages;
    total = data.totalElements;
    for (const meeting of data.content) {
      if (typeof meeting.code !== 'string' || !Number.isFinite(Date.parse(meeting.startDate)) || !Array.isArray(meeting.meetingTitles)) {
        throw new Error('Invalid committee meeting');
      }
      records.set(meeting.code, meeting);
    }
  }
  if (records.size !== total || total === 0) throw new Error('Incomplete committee meeting list');
  return [...records.values()].sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate)).map(m => ({
    meeting_code: m.code,
    title: m.meetingTitles.find(t => t.language === 'EN')?.title || m.meetingTitles[0]?.title || `Meeting ${m.code}`,
    date: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Brussels' }).format(new Date(m.startDate)),
    committee: 'Committee on the European Health Data Space',
    url: `https://ec.europa.eu/transparency/comitology-register/screen/meetings/${encodeURIComponent(m.code)}`,
  }));
}

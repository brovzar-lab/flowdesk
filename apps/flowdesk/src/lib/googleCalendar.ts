import type { TimeRange } from './schedulingEngine';
import { isDemoMode } from './config';

export const DEMO_CALENDAR_GAPS: TimeRange[] = [
  {
    start: new Date(new Date().setHours(9, 0, 0, 0)),
    end: new Date(new Date().setHours(10, 0, 0, 0)),
  },
  {
    start: new Date(new Date().setHours(10, 30, 0, 0)),
    end: new Date(new Date().setHours(12, 0, 0, 0)),
  },
  {
    start: new Date(new Date().setHours(13, 0, 0, 0)),
    end: new Date(new Date().setHours(17, 30, 0, 0)),
  },
];

interface CalendarEvent {
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

function computeGaps(events: CalendarEvent[], dayStart: Date, dayEnd: Date): TimeRange[] {
  const sorted = [...events]
    .map((e) => ({
      start: new Date(e.start.dateTime ?? e.start.date ?? ''),
      end: new Date(e.end.dateTime ?? e.end.date ?? ''),
    }))
    .filter((e) => !isNaN(e.start.getTime()))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: TimeRange[] = [];
  let cursor = dayStart.getTime();

  for (const event of sorted) {
    const evStart = Math.max(event.start.getTime(), dayStart.getTime());
    const evEnd = Math.min(event.end.getTime(), dayEnd.getTime());
    if (evStart > cursor) {
      gaps.push({ start: new Date(cursor), end: new Date(evStart) });
    }
    if (evEnd > cursor) {
      cursor = evEnd;
    }
  }

  if (cursor < dayEnd.getTime()) {
    gaps.push({ start: new Date(cursor), end: dayEnd });
  }

  return gaps;
}

export async function fetchTodayCalendarGaps(accessToken: string): Promise<TimeRange[]> {
  if (isDemoMode || !accessToken) return DEMO_CALENDAR_GAPS;

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(8, 0, 0, 0);
  const dayEnd = new Date(now);
  dayEnd.setHours(18, 0, 0, 0);

  const params = new URLSearchParams({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    console.warn('Calendar fetch failed, using demo gaps');
    return DEMO_CALENDAR_GAPS;
  }

  const data: { items: CalendarEvent[] } = await res.json();
  return computeGaps(data.items ?? [], dayStart, dayEnd);
}

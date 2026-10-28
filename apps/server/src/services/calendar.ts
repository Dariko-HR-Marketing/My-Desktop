import ical, { type VEvent } from 'node-ical';
import type { CalendarEvent, CalendarToday } from '@ish-maydoni/shared';
import { TtlCache } from './cache.js';
import type { TextFetcher } from './ssrf.js';

const JOIN_LINK =
  /https?:\/\/(?:[\w-]+\.)*(?:meet\.google\.com|zoom\.us|zoom\.com|teams\.microsoft\.com|teams\.live\.com|webex\.com|whereby\.com|jit\.si)\/[^\s<>"')]+/i;

const text = (v: unknown): string =>
  typeof v === 'string'
    ? v
    : v && typeof v === 'object' && 'val' in v
      ? String((v as { val: unknown }).val ?? '')
      : '';

export function findJoinUrl(...parts: unknown[]): string | null {
  for (const p of parts) {
    const m = JOIN_LINK.exec(text(p).replace(/\\n/g, ' '));
    if (m) return m[0].replace(/[.,;]+$/, '');
  }
  return null;
}

const dayKey = (d: Date) => d.toISOString().substring(0, 10);

/** Events overlapping [from, to), recurring ones expanded, cancelled ones and EXDATEs removed, sorted by start. */
export function eventsBetween(ics: string, from: Date, to: Date): CalendarEvent[] {
  const parsed = ical.sync.parseICS(ics);
  const out: CalendarEvent[] = [];

  const push = (ev: VEvent, start: Date, end: Date) => {
    if (!(start < to && end > from)) return;
    if (String((ev as { status?: string }).status ?? '').toUpperCase() === 'CANCELLED') return;
    out.push({
      id: `${ev.uid}@${start.toISOString()}`,
      title: text(ev.summary).trim() || '(Nomsiz)',
      start: start.toISOString(),
      end: end.toISOString(),
      allDay: ev.datetype === 'date',
      location: text(ev.location).trim() || null,
      joinUrl: findJoinUrl(ev.url, ev.location, ev.description),
    });
  };

  for (const item of Object.values(parsed)) {
    if (!item || item.type !== 'VEVENT') continue;
    const ev = item as VEvent;
    if (!(ev.start instanceof Date)) continue;
    const start = ev.start;
    const end =
      ev.end instanceof Date
        ? ev.end
        : new Date(start.getTime() + (ev.datetype === 'date' ? 86_400_000 : 0));
    const duration = Math.max(0, end.getTime() - start.getTime());

    if (!ev.rrule) {
      push(ev, start, end);
      continue;
    }
    const excluded = new Set<string>();
    for (const [k, v] of Object.entries(ev.exdate ?? {})) {
      excluded.add(k.substring(0, 10));
      if (v instanceof Date) excluded.add(dayKey(v));
    }
    const overrides = ev.recurrences ?? {};
    const occurrences = ev.rrule.between(new Date(from.getTime() - duration), to, true);
    for (const occ of occurrences) {
      const key = dayKey(occ);
      const override = overrides[key] as VEvent | undefined;
      if (override && override.start instanceof Date) {
        const oEnd =
          override.end instanceof Date
            ? override.end
            : new Date(override.start.getTime() + duration);
        push({ ...ev, ...override, uid: ev.uid } as VEvent, override.start, oEnd);
      } else if (!excluded.has(key)) {
        push(ev, occ, new Date(occ.getTime() + duration));
      }
    }
  }
  return out.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
}

export class CalendarUnavailableError extends Error {}

/** Per-calendar-URL cache (5 min) with stale-if-error. The cache key is the URL, which is a secret: it never leaves memory. */
export function createCalendarService(fetchText: TextFetcher, now: () => Date = () => new Date()) {
  const caches = new Map<string, TtlCache<string>>();
  return {
    async today(url: string, from: Date, to: Date): Promise<CalendarToday> {
      let cache = caches.get(url);
      if (!cache) caches.set(url, (cache = new TtlCache<string>(5 * 60_000, now)));
      try {
        const r = await cache.get(() => fetchText(url));
        return {
          configured: true,
          items: eventsBetween(r.value, from, to),
          fetchedAt: r.fetchedAt.toISOString(),
          stale: r.stale,
        };
      } catch {
        throw new CalendarUnavailableError('Kalendarni yuklab boʻlmadi');
      }
    },
  };
}

export type CalendarService = ReturnType<typeof createCalendarService>;

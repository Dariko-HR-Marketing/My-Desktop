import type { TaskPriority } from '@ish-maydoni/shared';
import { formatDate, formatTime } from './format';

export type ChipKind = 'date' | 'time' | 'priority' | 'assignee' | 'list';

export interface QuickChip {
  kind: ChipKind;
  /** Text shown on the chip, e.g. "29-oktabr", "10:00", "Yuqori", "@Karimov". */
  label: string;
  start: number;
  end: number;
}

export interface QuickAddResult {
  title: string;
  dueAt: Date | null;
  priority: TaskPriority | null;
  assignee: string | null;
  list: string | null;
  chips: QuickChip[];
}

const MONTHS = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
];
// getDay() order: Sunday = 0
const WEEKDAYS = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
const DEFAULT_HOUR = 18;

const PRIORITY: Record<string, TaskPriority> = {
  yuqori: 'HIGH',
  muhim: 'HIGH',
  past: 'LOW',
  oddiy: 'NORMAL',
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  HIGH: 'Yuqori',
  NORMAL: 'Oddiy',
  LOW: 'Past',
};

const B = String.raw`(?<![\p{L}\p{N}])`;
const E = String.raw`(?![\p{L}\p{N}])`;

interface Hit {
  kind: ChipKind;
  start: number;
  end: number;
  /** Date tokens resolve to a calendar date, time tokens to [h, m]. */
  date?: { day: number; month: number; year?: number } | { offset: number } | { weekday: number };
  time?: [number, number];
  priority?: TaskPriority;
  text?: string;
}

/**
 * Typographic apostrophes (ʻ ʼ ’ ‘ `) are folded to a plain one for keyword matching only.
 * Every replacement is a single UTF-16 unit, so indexes in the folded text match the original.
 */
const fold = (s: string) => s.toLowerCase().replace(/[ʻʼ‘’`]/g, "'");

const validDate = (day: number, month: number, year: number) => {
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function parseQuickAdd(input: string, now: Date = new Date()): QuickAddResult {
  const text = fold(input);
  const hits: Hit[] = [];
  const free = (start: number, end: number) => hits.every((h) => end <= h.start || start >= h.end);
  const add = (h: Hit) => {
    if (free(h.start, h.end)) hits.push(h);
  };
  const scan = (re: RegExp, fn: (m: RegExpExecArray) => Hit | null) => {
    for (const m of text.matchAll(re)) {
      const hit = fn(m as RegExpExecArray);
      if (hit) add(hit);
    }
  };
  const span = (m: RegExpExecArray) => ({ start: m.index!, end: m.index! + m[0].length });

  // 1. unambiguous tokens
  scan(new RegExp(`${B}!(yuqori|muhim|past|oddiy)${E}`, 'giu'), (m) => ({
    kind: 'priority',
    ...span(m),
    priority: PRIORITY[m[1]!]!,
  }));
  scan(new RegExp(`${B}@([\\p{L}\\p{N}_']+)`, 'gu'), (m) => ({
    kind: 'assignee',
    ...span(m),
    text: input.slice(m.index! + 1, m.index! + m[0].length),
  }));
  scan(new RegExp(`${B}#([\\p{L}\\p{N}_']+)`, 'gu'), (m) => ({
    kind: 'list',
    ...span(m),
    text: input.slice(m.index! + 1, m.index! + m[0].length),
  }));
  scan(/(?<![\d.:])([01]?\d|2[0-3]):([0-5]\d)(?![\d:])/g, (m) => ({
    kind: 'time',
    ...span(m),
    time: [Number(m[1]), Number(m[2])],
  }));
  scan(/(?<![\d.])(\d{1,2})\.(\d{1,2})\.(\d{4})(?![\d.])/g, (m) =>
    validDate(Number(m[1]), Number(m[2]), Number(m[3]))
      ? {
          kind: 'date',
          ...span(m),
          date: { day: Number(m[1]), month: Number(m[2]), year: Number(m[3]) },
        }
      : null,
  );
  scan(new RegExp(`${B}(bugun|ertaga|indinga)${E}`, 'giu'), (m) => ({
    kind: 'date',
    ...span(m),
    date: { offset: ['bugun', 'ertaga', 'indinga'].indexOf(m[1]!) },
  }));
  scan(new RegExp(`${B}(${WEEKDAYS.join('|')})${E}`, 'giu'), (m) => ({
    kind: 'date',
    ...span(m),
    date: { weekday: WEEKDAYS.indexOf(m[1]!) },
  }));
  scan(new RegExp(`(?<![\\d.])(\\d{1,2})\\s*-?\\s*(${MONTHS.join('|')})${E}`, 'giu'), (m) => {
    const day = Number(m[1]);
    const month = MONTHS.indexOf(m[2]!) + 1;
    return day >= 1 && day <= 31 && validDate(day, month, 2024)
      ? { kind: 'date', ...span(m), date: { day, month } }
      : null;
  });

  // 2. "28.10" is a date, "10.30" a time; "10.10" is both, so the date wins unless a date is already set.
  scan(/(?<![\d.:])(\d{1,2})\.(\d{1,2})(?![\d.:])/g, (m) => {
    const a = Number(m[1]);
    const b = Number(m[2]);
    const hasDate = hits.some((h) => h.kind === 'date');
    const hasTime = hits.some((h) => h.kind === 'time');
    const asDate = b >= 1 && b <= 12 && validDate(a, b, 2024);
    const asTime = a <= 23 && b <= 59 && m[2]!.length === 2;
    if (asDate && !hasDate) return { kind: 'date', ...span(m), date: { day: a, month: b } };
    if (asTime && !hasTime) return { kind: 'time', ...span(m), time: [a, b] };
    return null;
  });

  // Only the first token of each kind is used; later ones stay in the title as plain text.
  const used: Hit[] = [];
  for (const h of [...hits].sort((x, y) => x.start - y.start)) {
    if (!used.some((u) => u.kind === h.kind)) used.push(h);
  }

  const dateHit = used.find((h) => h.kind === 'date');
  const timeHit = used.find((h) => h.kind === 'time');
  const today = startOfDay(now);

  let day: Date | null = null;
  if (dateHit?.date) {
    const d = dateHit.date;
    if ('offset' in d) day = addDays(today, d.offset);
    else if ('weekday' in d) day = addDays(today, ((d.weekday - today.getDay() + 6) % 7) + 1);
    else if (d.year !== undefined) day = new Date(d.year, d.month - 1, d.day);
    else {
      day = new Date(today.getFullYear(), d.month - 1, d.day);
      if (day < today) day = new Date(today.getFullYear() + 1, d.month - 1, d.day);
    }
  }

  let dueAt: Date | null = null;
  if (day) {
    const [h, mi] = timeHit?.time ?? [DEFAULT_HOUR, 0];
    dueAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi);
  } else if (timeHit?.time) {
    const [h, mi] = timeHit.time;
    dueAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, mi);
    if (dueAt <= now)
      dueAt = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, h, mi);
  }

  const chips: QuickChip[] = used
    .map((h): QuickChip => {
      const base = { kind: h.kind, start: h.start, end: h.end };
      if (h.kind === 'date')
        return { ...base, label: dueAt ? formatDate(dueAt) : input.slice(h.start, h.end) };
      if (h.kind === 'time')
        return { ...base, label: formatTime(new Date(2000, 0, 1, h.time![0], h.time![1])) };
      if (h.kind === 'priority') return { ...base, label: PRIORITY_LABEL[h.priority!] };
      return { ...base, label: `${h.kind === 'assignee' ? '@' : '#'}${h.text}` };
    })
    .sort((a, b) => a.start - b.start);

  let title = '';
  let cursor = 0;
  for (const h of [...used].sort((a, b) => a.start - b.start)) {
    title += input.slice(cursor, h.start) + ' ';
    cursor = h.end;
  }
  title = (title + input.slice(cursor)).replace(/\s+/g, ' ').trim();

  return {
    title,
    dueAt,
    priority: used.find((h) => h.kind === 'priority')?.priority ?? null,
    assignee: used.find((h) => h.kind === 'assignee')?.text ?? null,
    list: used.find((h) => h.kind === 'list')?.text ?? null,
    chips,
  };
}

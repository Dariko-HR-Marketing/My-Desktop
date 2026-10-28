import type { EdoAssignment, EdoControlRow, EdoDocument } from '@ish-maydoni/shared';
import { teLeft } from './messages';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** "2 kun kechikdi", "8 soat", "3 kun". */
export function leftLabel(dueIso: string, now: Date): string {
  const diff = new Date(dueIso).getTime() - now.getTime();
  if (diff < 0) {
    const late = -diff;
    return late >= DAY
      ? teLeft('overdueDays', Math.floor(late / DAY))
      : teLeft('overdueHours', Math.max(1, Math.floor(late / HOUR)));
  }
  if (diff >= DAY) return teLeft('days', Math.floor(diff / DAY));
  if (diff >= HOUR) return teLeft('hours', Math.floor(diff / HOUR));
  return teLeft('minutes', Math.max(1, Math.floor(diff / MIN)));
}

export type DocFilter =
  'all' | 'Kiruvchi' | 'Chiquvchi' | 'Ichki' | 'Buyruq' | 'today' | 'important' | 'unread' | 'sign';

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function filterDocs(docs: EdoDocument[], filter: DocFilter, now: Date): EdoDocument[] {
  const match = (d: EdoDocument): boolean => {
    switch (filter) {
      case 'all':
        return true;
      case 'today':
        return !!d.due && sameDay(new Date(d.due), now) && d.status !== 'DONE';
      case 'important':
        return d.important;
      case 'unread':
        return d.unread;
      case 'sign':
        return d.status === 'SIGN';
      default:
        return d.type === filter;
    }
  };
  return docs.filter(match).sort((a, b) => b.date.localeCompare(a.date));
}

export function countDocs(docs: EdoDocument[], now: Date): Record<DocFilter, number> {
  const keys: DocFilter[] = [
    'all',
    'Kiruvchi',
    'Chiquvchi',
    'Ichki',
    'Buyruq',
    'today',
    'important',
    'unread',
    'sign',
  ];
  return Object.fromEntries(keys.map((k) => [k, filterDocs(docs, k, now).length])) as Record<
    DocFilter,
    number
  >;
}

const ORDER: Record<EdoControlRow['status'], number> = {
  OVERDUE: 0,
  TODAY: 1,
  SOON: 2,
  PLANNED: 3,
};

/** Most urgent first; within a status, the earliest due date first. */
export function sortControlRows(rows: EdoControlRow[]): EdoControlRow[] {
  return [...rows].sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.due.localeCompare(b.due));
}

/** The few items worth starting with today: overdue first, then due today. */
export function recommendations(rows: EdoControlRow[], limit = 3): EdoControlRow[] {
  return sortControlRows(rows.filter((r) => r.status === 'OVERDUE' || r.status === 'TODAY')).slice(
    0,
    limit,
  );
}

export const COLUMNS: EdoAssignment['column'][] = ['NEW', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const signDocs = (docs: EdoDocument[]) => docs.filter((d) => d.status === 'SIGN');

/** Upcoming deadlines for the overview: soonest open items that are not overdue-listed elsewhere. */
export function upcomingRows(rows: EdoControlRow[], limit = 4): EdoControlRow[] {
  return sortControlRows(rows).slice(0, limit);
}

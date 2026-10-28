import type { UserSettings } from '@ish-maydoni/shared';

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'system',
  density: 'comfortable',
  language: 'uz-Latn',
  fontSize: 'md',
  pinnedApps: ['telegram', 'whatsapp', 'instagram', 'youtube'],
  navCollapsed: false,
  quietEnabled: false,
  quietFrom: '22:00',
  quietTo: '07:00',
  sleepMinutes: 10,
  calendarUrl: '',
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

/** Is `now` inside the quiet range? Handles ranges that cross midnight (22:00 → 07:00). */
export function inQuietHours(now: Date, from: string, to: string): boolean {
  const cur = now.getHours() * 60 + now.getMinutes();
  const a = toMinutes(from);
  const b = toMinutes(to);
  if (a === b) return false;
  return a < b ? cur >= a && cur < b : cur >= a || cur < b;
}

export type NotificationCategory = 'WORK' | 'MESSAGE' | 'SYSTEM';

/**
 * Whether a new notification should also pop up as a system notification.
 * Work items (overdue, signatures, meetings) are urgent and always do; messages only outside quiet hours;
 * system notices never do.
 */
export function showSystemNotification(
  category: NotificationCategory,
  s: Pick<UserSettings, 'quietEnabled' | 'quietFrom' | 'quietTo'>,
  now: Date,
): boolean {
  if (category === 'WORK') return true;
  if (category === 'SYSTEM') return false;
  return !(s.quietEnabled && inQuietHours(now, s.quietFrom, s.quietTo));
}

/** Pinned apps shown in the menu: pinned ones in their saved order, plus mandatory ones (admin-enforced) that are missing. */
export function visibleAppKeys(
  pinned: string[],
  all: { key: string; mandatory: boolean }[],
): string[] {
  const known = new Set(all.map((a) => a.key));
  const keys = pinned.filter((k) => known.has(k));
  for (const a of all) if (a.mandatory && !keys.includes(a.key)) keys.push(a.key);
  return keys;
}

export function movePinned(pinned: string[], key: string, delta: -1 | 1): string[] {
  const i = pinned.indexOf(key);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= pinned.length) return pinned;
  const next = [...pinned];
  [next[i], next[j]] = [next[j]!, next[i]!];
  return next;
}

export function togglePinned(pinned: string[], key: string, on: boolean): string[] {
  const without = pinned.filter((k) => k !== key);
  return on ? [...without, key] : without;
}

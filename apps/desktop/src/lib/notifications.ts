import type { NotificationItem } from '@ish-maydoni/shared';

export type NotificationTab = 'all' | 'WORK' | 'MESSAGE' | 'SYSTEM';
export type NotificationGroupKey = 'now' | 'earlier' | 'yesterday' | 'older';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function groupKeyFor(createdAt: string, now: Date): NotificationGroupKey {
  const t = new Date(createdAt).getTime();
  if (now.getTime() - t < 60 * 60_000) return 'now';
  const today = startOfDay(now);
  if (t >= today) return 'earlier';
  if (t >= today - 86_400_000) return 'yesterday';
  return 'older';
}

export function filterByTab(items: NotificationItem[], tab: NotificationTab): NotificationItem[] {
  return tab === 'all' ? items : items.filter((n) => n.category === tab);
}

export function countsByTab(items: NotificationItem[]): Record<NotificationTab, number> {
  const unread = items.filter((n) => n.readAt === null);
  return {
    all: unread.length,
    WORK: unread.filter((n) => n.category === 'WORK').length,
    MESSAGE: unread.filter((n) => n.category === 'MESSAGE').length,
    SYSTEM: unread.filter((n) => n.category === 'SYSTEM').length,
  };
}

/** Newest first, split into the drawer's groups; empty groups are omitted. */
export function groupNotifications(
  items: NotificationItem[],
  now: Date,
): { key: NotificationGroupKey; items: NotificationItem[] }[] {
  const order: NotificationGroupKey[] = ['now', 'earlier', 'yesterday', 'older'];
  const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return order
    .map((key) => ({ key, items: sorted.filter((n) => groupKeyFor(n.createdAt, now) === key) }))
    .filter((g) => g.items.length > 0);
}

import { describe, expect, it } from 'vitest';
import type { NotificationItem } from '@ish-maydoni/shared';
import { countsByTab, filterByTab, groupKeyFor, groupNotifications } from './notifications';

const now = new Date(2026, 9, 28, 12, 0);
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
let n = 0;
const item = (o: Partial<NotificationItem>): NotificationItem => ({
  id: String(++n),
  category: 'WORK',
  title: 't',
  body: '',
  actionLabel: null,
  actionUrl: null,
  readAt: null,
  createdAt: ago(5),
  ...o,
});

describe('notification grouping', () => {
  it('classifies by age', () => {
    expect(groupKeyFor(ago(10), now)).toBe('now');
    expect(groupKeyFor(ago(59), now)).toBe('now');
    expect(groupKeyFor(ago(90), now)).toBe('earlier'); // 10:30 today
    expect(groupKeyFor(ago(12 * 60 + 1), now)).toBe('yesterday'); // 23:59 yesterday
    expect(groupKeyFor(ago(40 * 60), now)).toBe('older');
  });
  it('groups newest first and omits empty groups', () => {
    const a = item({ createdAt: ago(2) });
    const b = item({ createdAt: ago(30) });
    const c = item({ createdAt: ago(100) });
    const groups = groupNotifications([c, a, b], now);
    expect(groups.map((g) => g.key)).toEqual(['now', 'earlier']);
    expect(groups[0]!.items).toEqual([a, b]);
  });
  it('filters by tab and counts unread per tab', () => {
    const items = [
      item({}),
      item({ category: 'MESSAGE' }),
      item({ category: 'MESSAGE', readAt: ago(1) }),
      item({ category: 'SYSTEM' }),
    ];
    expect(filterByTab(items, 'MESSAGE')).toHaveLength(2);
    expect(filterByTab(items, 'all')).toHaveLength(4);
    expect(countsByTab(items)).toEqual({ all: 3, WORK: 1, MESSAGE: 1, SYSTEM: 1 });
  });
});

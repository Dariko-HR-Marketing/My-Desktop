import { describe, expect, it } from 'vitest';
import { firstOpenToday } from './workday';

const memory = () => {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
};

describe('firstOpenToday', () => {
  it('remembers the first open of the day and keeps it for later calls', () => {
    const store = memory();
    const morning = new Date(2026, 9, 28, 8, 52);
    expect(firstOpenToday(morning, store).getTime()).toBe(morning.getTime());
    expect(firstOpenToday(new Date(2026, 9, 28, 13, 0), store).getTime()).toBe(morning.getTime());
  });
  it('starts over on a new day', () => {
    const store = memory();
    firstOpenToday(new Date(2026, 9, 28, 8, 52), store);
    const next = new Date(2026, 9, 29, 9, 5);
    expect(firstOpenToday(next, store).getTime()).toBe(next.getTime());
  });
  it('works without storage', () => {
    const now = new Date(2026, 9, 28, 8, 0);
    expect(firstOpenToday(now, null)).toBe(now);
  });
});

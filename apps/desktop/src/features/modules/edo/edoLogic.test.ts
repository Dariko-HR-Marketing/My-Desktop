import { describe, expect, it } from 'vitest';
import { buildEdoData } from '@ish-maydoni/shared';
import { countDocs, filterDocs, leftLabel, recommendations, sortControlRows } from './edoLogic';

const now = new Date(2026, 9, 28, 12, 0);
const data = buildEdoData(now);
const ms = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

describe('leftLabel', () => {
  it('formats future and past deadlines', () => {
    expect(leftLabel(ms(8), now)).toBe('8 soat');
    expect(leftLabel(ms(0.25), now)).toBe('15 daqiqa');
    expect(leftLabel(ms(49), now)).toBe('2 kun');
    expect(leftLabel(ms(-5), now)).toBe('5 soat kechikdi');
    expect(leftLabel(ms(-49), now)).toBe('2 kun kechikdi');
    expect(leftLabel(ms(-0.2), now)).toBe('1 soat kechikdi');
  });
});

describe('document filters', () => {
  it('filters by folder and quick filter, newest first', () => {
    const incoming = filterDocs(data.documents, 'Kiruvchi', now);
    expect(incoming.length).toBeGreaterThan(0);
    expect(incoming.every((d) => d.type === 'Kiruvchi')).toBe(true);
    expect(incoming.map((d) => d.date)).toEqual([...incoming.map((d) => d.date)].sort().reverse());
    expect(filterDocs(data.documents, 'sign', now).every((d) => d.status === 'SIGN')).toBe(true);
    expect(filterDocs(data.documents, 'unread', now).every((d) => d.unread)).toBe(true);
    expect(filterDocs(data.documents, 'important', now).every((d) => d.important)).toBe(true);
  });
  it('"today" means due on the current day and not finished', () => {
    const today = filterDocs(data.documents, 'today', now);
    expect(today.length).toBeGreaterThan(0);
    expect(
      today.every(
        (d) => new Date(d.due!).toDateString() === now.toDateString() && d.status !== 'DONE',
      ),
    ).toBe(true);
  });
  it('counts match the filters', () => {
    const c = countDocs(data.documents, now);
    expect(c.all).toBe(data.documents.length);
    expect(c.Kiruvchi + c.Chiquvchi + c.Ichki + c.Buyruq).toBe(c.all);
  });
});

describe('control rows', () => {
  it('sorts by urgency then date', () => {
    const sorted = sortControlRows(data.control.rows);
    expect(sorted.map((r) => r.status).slice(0, 2)).toEqual(['OVERDUE', 'OVERDUE']);
    const order = ['OVERDUE', 'TODAY', 'SOON', 'PLANNED'];
    const idx = sorted.map((r) => order.indexOf(r.status));
    expect(idx).toEqual([...idx].sort((a, b) => a - b));
  });
  it('recommends the most urgent few', () => {
    const reco = recommendations(data.control.rows);
    expect(reco).toHaveLength(3);
    expect(reco.every((r) => r.status === 'OVERDUE' || r.status === 'TODAY')).toBe(true);
    expect(recommendations(data.control.rows, 10)).toHaveLength(4);
  });
});

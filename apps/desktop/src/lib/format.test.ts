import { describe, expect, it } from 'vitest';
import { formatDate, formatTime, initials } from './format';

describe('format', () => {
  it('formats time with leading zeros', () => {
    expect(formatTime(new Date(2026, 9, 28, 9, 2))).toBe('09:02');
  });
  it('formats the date in Uzbek', () => {
    expect(formatDate(new Date(2026, 9, 28))).toBe('28-oktabr');
    expect(formatDate(new Date(2026, 0, 5))).toBe('5-yanvar');
  });
  it('builds initials', () => {
    expect(initials('Aziz Karimov')).toBe('AK');
    expect(initials('  aziz ')).toBe('A');
    expect(initials(undefined)).toBe('I');
  });
});

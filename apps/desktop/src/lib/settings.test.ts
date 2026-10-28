import { describe, expect, it } from 'vitest';
import {
  inQuietHours,
  movePinned,
  showSystemNotification,
  togglePinned,
  visibleAppKeys,
} from './settings';

const at = (h: number, m = 0) => new Date(2026, 9, 28, h, m);

describe('inQuietHours', () => {
  it('handles a range inside one day', () => {
    expect(inQuietHours(at(13), '12:00', '14:00')).toBe(true);
    expect(inQuietHours(at(14), '12:00', '14:00')).toBe(false);
    expect(inQuietHours(at(11, 59), '12:00', '14:00')).toBe(false);
  });
  it('handles a range crossing midnight', () => {
    expect(inQuietHours(at(23), '22:00', '07:00')).toBe(true);
    expect(inQuietHours(at(3), '22:00', '07:00')).toBe(true);
    expect(inQuietHours(at(7), '22:00', '07:00')).toBe(false);
    expect(inQuietHours(at(12), '22:00', '07:00')).toBe(false);
    expect(inQuietHours(at(22), '22:00', '07:00')).toBe(true);
  });
  it('treats an empty range as never quiet', () => {
    expect(inQuietHours(at(10), '10:00', '10:00')).toBe(false);
  });
});

describe('showSystemNotification', () => {
  const quiet = { quietEnabled: true, quietFrom: '22:00', quietTo: '07:00' };
  const loud = { quietEnabled: false, quietFrom: '22:00', quietTo: '07:00' };
  it('always shows urgent work items, even in quiet hours', () => {
    expect(showSystemNotification('WORK', quiet, at(23))).toBe(true);
    expect(showSystemNotification('WORK', loud, at(12))).toBe(true);
  });
  it('mutes messages in quiet hours only when quiet mode is on', () => {
    expect(showSystemNotification('MESSAGE', quiet, at(23))).toBe(false);
    expect(showSystemNotification('MESSAGE', quiet, at(12))).toBe(true);
    expect(showSystemNotification('MESSAGE', loud, at(23))).toBe(true);
  });
  it('never pops up system notices', () => {
    expect(showSystemNotification('SYSTEM', loud, at(12))).toBe(false);
  });
});

describe('pinned apps', () => {
  const all = [
    { key: 'telegram', mandatory: false },
    { key: 'lex', mandatory: true },
    { key: 'youtube', mandatory: false },
  ];
  it('keeps the saved order, drops unknown keys and appends missing mandatory apps', () => {
    expect(visibleAppKeys(['youtube', 'ghost', 'telegram'], all)).toEqual([
      'youtube',
      'telegram',
      'lex',
    ]);
    expect(visibleAppKeys(['lex', 'telegram'], all)).toEqual(['lex', 'telegram']);
  });
  it('moves apps up and down within bounds', () => {
    expect(movePinned(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c']);
    expect(movePinned(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'c', 'b']);
    expect(movePinned(['a', 'b', 'c'], 'a', -1)).toEqual(['a', 'b', 'c']);
    expect(movePinned(['a', 'b', 'c'], 'c', 1)).toEqual(['a', 'b', 'c']);
    expect(movePinned(['a'], 'zzz', 1)).toEqual(['a']);
  });
  it('toggles membership', () => {
    expect(togglePinned(['a'], 'b', true)).toEqual(['a', 'b']);
    expect(togglePinned(['a', 'b'], 'a', false)).toEqual(['b']);
    expect(togglePinned(['a', 'b'], 'a', true)).toEqual(['b', 'a']);
  });
});

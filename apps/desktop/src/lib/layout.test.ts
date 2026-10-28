import { describe, expect, it } from 'vitest';
import { breakpointFor, effectiveDensity, navModeFor } from './layout';

describe('breakpointFor', () => {
  it.each([
    [1920, 'desktop'],
    [1280, 'desktop'],
    [1279, 'laptop'],
    [1024, 'laptop'],
    [1023, 'tablet'],
    [600, 'tablet'],
    [599, 'phone'],
    [390, 'phone'],
  ] as const)('%ipx → %s', (width, expected) => {
    expect(breakpointFor(width)).toBe(expected);
  });
});

describe('navModeFor', () => {
  it('uses the full menu on desktop and honours collapse', () => {
    expect(navModeFor('desktop', false, false)).toBe('full');
    expect(navModeFor('desktop', true, false)).toBe('rail');
  });
  it('uses icons on laptop and tablet', () => {
    expect(navModeFor('laptop', false, false)).toBe('rail');
    expect(navModeFor('tablet', false, false)).toBe('rail');
  });
  it('forces icons on the browser page', () => {
    expect(navModeFor('desktop', false, true)).toBe('rail');
  });
  it('uses the bottom nav on phones, even in the browser', () => {
    expect(navModeFor('phone', false, false)).toBe('bottom');
    expect(navModeFor('phone', false, true)).toBe('bottom');
  });
});

describe('effectiveDensity', () => {
  it('keeps compact only from laptop up', () => {
    expect(effectiveDensity('desktop', 'compact')).toBe('compact');
    expect(effectiveDensity('laptop', 'compact')).toBe('compact');
    expect(effectiveDensity('tablet', 'compact')).toBe('comfortable');
    expect(effectiveDensity('phone', 'compact')).toBe('comfortable');
  });
});

import { useSyncExternalStore } from 'react';

export type Breakpoint = 'phone' | 'tablet' | 'laptop' | 'desktop';
export type NavMode = 'full' | 'rail' | 'bottom';
export type Theme = 'light' | 'dark' | 'system';
export type Density = 'comfortable' | 'compact';

/** Breakpoints from docs/03 §5 (kept in sync with design-tokens.json). */
export function breakpointFor(width: number): Breakpoint {
  if (width >= 1280) return 'desktop';
  if (width >= 1024) return 'laptop';
  if (width >= 600) return 'tablet';
  return 'phone';
}

/**
 * Desktop: full menu (collapsible to icons). Laptop/tablet: icons. Phone: bottom nav.
 * The browser page forces icon mode at any size (phone has no side menu at all).
 */
export function navModeFor(bp: Breakpoint, collapsed: boolean, onBrowser: boolean): NavMode {
  if (bp === 'phone') return 'bottom';
  if (bp !== 'desktop' || onBrowser) return 'rail';
  return collapsed ? 'rail' : 'full';
}

/** Compact density is mouse-only: it applies from the laptop size up. */
export function effectiveDensity(bp: Breakpoint, density: Density): Density {
  return bp === 'phone' || bp === 'tablet' ? 'comfortable' : density;
}

const subscribe = (cb: () => void) => {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
};

export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(
    subscribe,
    () => breakpointFor(window.innerWidth),
    () => 'desktop',
  );
}

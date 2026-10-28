import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Density, Theme } from '../lib/layout';

export type FontSize = 'sm' | 'md' | 'lg';

interface UiState {
  theme: Theme;
  density: Density;
  fontSize: FontSize;
  navCollapsed: boolean;
  networksOpen: boolean;
  /** Minutes before an idle browser tab sleeps; 0 = never. */
  sleepMinutes: number;
  // transient (not persisted)
  notificationsOpen: boolean;
  paletteOpen: boolean;
  setLocal(
    patch: Partial<
      Pick<UiState, 'theme' | 'density' | 'fontSize' | 'navCollapsed' | 'sleepMinutes'>
    >,
  ): void;
  setNotificationsOpen(open: boolean): void;
  setPaletteOpen(open: boolean): void;
  toggleNetworks(): void;
}

// Non-sensitive preferences only. Storage may be unavailable (private mode), so fall back to memory.
const safeStorage = createJSONStorage(() => {
  try {
    localStorage.getItem('probe');
    return localStorage;
  } catch {
    return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  }
});

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      theme: 'system',
      density: 'comfortable',
      fontSize: 'md',
      navCollapsed: false,
      networksOpen: true,
      sleepMinutes: 10,
      notificationsOpen: false,
      paletteOpen: false,
      setLocal: (patch) => set(patch),
      setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
      toggleNetworks: () => set((s) => ({ networksOpen: !s.networksOpen })),
    }),
    {
      name: 'ish-maydoni-ui',
      storage: safeStorage,
      partialize: (s) => ({
        theme: s.theme,
        density: s.density,
        fontSize: s.fontSize,
        navCollapsed: s.navCollapsed,
        networksOpen: s.networksOpen,
        sleepMinutes: s.sleepMinutes,
      }),
    },
  ),
);

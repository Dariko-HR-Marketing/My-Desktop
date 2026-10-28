import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Density, Theme } from '../lib/layout';

interface UiState {
  theme: Theme;
  density: Density;
  navCollapsed: boolean;
  networksOpen: boolean;
  setTheme(theme: Theme): void;
  setDensity(density: Density): void;
  toggleNav(): void;
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
      navCollapsed: false,
      networksOpen: true,
      setTheme: (theme) => set({ theme }),
      setDensity: (density) => set({ density }),
      toggleNav: () => set((s) => ({ navCollapsed: !s.navCollapsed })),
      toggleNetworks: () => set((s) => ({ networksOpen: !s.networksOpen })),
    }),
    { name: 'ish-maydoni-ui', storage: safeStorage },
  ),
);

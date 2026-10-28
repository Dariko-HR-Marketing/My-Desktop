import { create } from 'zustand';

/**
 * Native tab webviews are drawn above all HTML, so while any overlay (drawer, palette) is open
 * the browser hides them; this counts the open overlays.
 */
interface OverlayState {
  count: number;
  acquire(): () => void;
}

export const useOverlay = create<OverlayState>()((set) => ({
  count: 0,
  acquire: () => {
    set((s) => ({ count: s.count + 1 }));
    let released = false;
    return () => {
      if (released) return;
      released = true;
      set((s) => ({ count: Math.max(0, s.count - 1) }));
    };
  },
}));

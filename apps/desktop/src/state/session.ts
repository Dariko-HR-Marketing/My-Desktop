import { create } from 'zustand';
import type { User, UserSettings } from '@ish-maydoni/shared';

export type SessionStatus = 'loading' | 'authed' | 'anon';

interface SessionState {
  status: SessionStatus;
  token: string | null;
  user: User | null;
  settings: UserSettings | null;
  /** No server: local sample data only, nothing is sent anywhere. */
  demo: boolean;
  setSession(token: string, user: User, settings: UserSettings | null): void;
  setUser(user: User, settings: UserSettings | null): void;
  setSettings(settings: UserSettings): void;
  enterDemo(user: User, settings: UserSettings): void;
  setAnon(): void;
}

// The token itself lives in the OS credential store (lib/platform.ts); this is only its in-memory copy.
export const useSession = create<SessionState>()((set) => ({
  status: 'loading',
  token: null,
  user: null,
  settings: null,
  demo: false,
  setSession: (token, user, settings) =>
    set({ status: 'authed', token, user, settings, demo: false }),
  setUser: (user, settings) => set({ user, settings }),
  setSettings: (settings) => set({ settings }),
  enterDemo: (user, settings) => set({ status: 'authed', token: null, user, settings, demo: true }),
  setAnon: () => set({ status: 'anon', token: null, user: null, settings: null, demo: false }),
}));

import { create } from 'zustand';
import type { User, UserSettings } from '@ish-maydoni/shared';

interface SessionState {
  token: string | null;
  user: User | null;
  settings: UserSettings | null;
  setSession(token: string, user: User, settings: UserSettings | null): void;
  clear(): void;
}

// In memory only for now: the token goes to secure storage together with the login flow (stage 4).
export const useSession = create<SessionState>()((set) => ({
  token: null,
  user: null,
  settings: null,
  setSession: (token, user, settings) => set({ token, user, settings }),
  clear: () => set({ token: null, user: null, settings: null }),
}));

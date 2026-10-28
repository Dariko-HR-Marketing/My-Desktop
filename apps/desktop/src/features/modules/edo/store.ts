import { create } from 'zustand';
import { buildEdoData, type EdoData } from '@ish-maydoni/shared';
import { ApiError, NetworkError } from '../../../lib/api';
import { readCache, writeCache } from '../../../lib/cache';
import { api } from '../../../lib/client';
import { useSession } from '../../../state/session';

export type EdoError = 'forbidden' | 'network' | 'server' | null;

interface EdoState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: EdoData | null;
  error: EdoError;
  load(): Promise<void>;
  reset(): void;
}

export const useEdo = create<EdoState>()((set, get) => ({
  status: 'idle',
  data: null,
  error: null,

  async load() {
    if (useSession.getState().demo) {
      set({ status: 'ready', data: buildEdoData(new Date()), error: null });
      return;
    }
    const cached = readCache<EdoData>('edo');
    if (cached && !get().data) set({ status: 'ready', data: cached.value });
    else if (!get().data) set({ status: 'loading' });
    try {
      const data = await api.get<EdoData>('/api/modules/edo/data');
      writeCache('edo', data);
      set({ status: 'ready', data, error: null });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403)
        set({ status: 'error', data: null, error: 'forbidden' });
      else if (get().data)
        set({ error: err instanceof NetworkError ? 'network' : 'server' }); // keep showing what we have
      else set({ status: 'error', error: err instanceof NetworkError ? 'network' : 'server' });
    }
  },

  reset: () => set({ status: 'idle', data: null, error: null }),
}));

// Another user must never see the previous user's module data.
useSession.subscribe((state, prev) => {
  if (prev.status === 'authed' && state.status !== 'authed') useEdo.getState().reset();
});

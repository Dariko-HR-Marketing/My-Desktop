import { create } from 'zustand';
import type {
  CurrencyWidget,
  DashboardInfo,
  ServerMessage,
  Task,
  WeatherWidget,
} from '@ish-maydoni/shared';
import { ApiError, NetworkError } from '../lib/api';
import { readCache, writeCache } from '../lib/cache';
import { api } from '../lib/client';
import { demoCurrency, demoDashboard, demoTasks, demoWeather } from '../lib/demoData';
import { computeTaskStats, toggled } from '../lib/home';
import { t } from '../lib/i18n';
import { useSession } from './session';
import { useToast } from './toast';

export interface Slice<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: T | null;
  updatedAt: number | null;
}

const empty = <T>(): Slice<T> => ({ status: 'idle', data: null, updatedAt: null });

interface DataState {
  tasks: Slice<Task[]>;
  dashboard: Slice<DashboardInfo>;
  currency: Slice<CurrencyWidget>;
  weather: Slice<WeatherWidget>;
  /** The last core request failed because the server is unreachable. */
  offline: boolean;
  loadAll(): Promise<void>;
  toggleTask(id: string): Promise<void>;
  applyMessage(msg: ServerMessage): void;
  reset(): void;
}

type Key = 'tasks' | 'dashboard' | 'currency' | 'weather';
const PATHS: Record<Key, string> = {
  tasks: '/api/tasks',
  dashboard: '/api/dashboard',
  currency: '/api/widgets/currency',
  weather: '/api/widgets/weather',
};

export const useData = create<DataState>()((set, get) => {
  const setSlice = <K extends Key>(key: K, patch: Partial<DataState[K]>) =>
    set((s) => ({ [key]: { ...s[key], ...patch } }) as Partial<DataState>);

  /** Cached copy first (instant), then the network. A failed refresh keeps whatever is already shown. */
  async function loadSlice(key: Key): Promise<boolean> {
    const cached = readCache<unknown>(key);
    if (cached && get()[key].data === null) {
      setSlice(key, { status: 'ready', data: cached.value as never, updatedAt: cached.savedAt });
    } else if (get()[key].data === null) {
      setSlice(key, { status: 'loading' });
    }
    try {
      const raw = await api.get<unknown>(PATHS[key]);
      const value = key === 'tasks' ? (raw as { items: Task[] }).items : raw;
      writeCache(key, value);
      setSlice(key, { status: 'ready', data: value as never, updatedAt: Date.now() });
      return true;
    } catch (err) {
      if (get()[key].data === null) setSlice(key, { status: 'error' });
      if (err instanceof NetworkError) return false;
      return true; // the server answered (e.g. 503 for a widget): not an offline situation
    }
  }

  return {
    tasks: empty(),
    dashboard: empty(),
    currency: empty(),
    weather: empty(),
    offline: false,

    async loadAll() {
      if (useSession.getState().demo) {
        const now = new Date();
        const tasks = demoTasks(now);
        set({
          offline: false,
          tasks: { status: 'ready', data: get().tasks.data ?? tasks, updatedAt: Date.now() },
          dashboard: {
            status: 'ready',
            data: demoDashboard(get().tasks.data ?? tasks, now),
            updatedAt: Date.now(),
          },
          currency: { status: 'ready', data: demoCurrency(now), updatedAt: Date.now() },
          weather: { status: 'ready', data: demoWeather(now), updatedAt: Date.now() },
        });
        return;
      }
      const reached = await Promise.all((Object.keys(PATHS) as Key[]).map(loadSlice));
      set({ offline: reached.some((ok) => !ok) });
    },

    async toggleTask(id) {
      const before = get().tasks.data;
      const task = before?.find((x) => x.id === id);
      if (!before || !task) return;
      const optimistic = toggled(task, new Date());
      set((s) => ({
        tasks: { ...s.tasks, data: before.map((x) => (x.id === id ? optimistic : x)) },
      }));
      if (useSession.getState().demo) return;
      try {
        const saved = await api.patch<Task>(`/api/tasks/${id}`, { status: optimistic.status });
        set((s) => ({
          tasks: { ...s.tasks, data: (s.tasks.data ?? []).map((x) => (x.id === id ? saved : x)) },
        }));
        writeCache('tasks', get().tasks.data);
      } catch (err) {
        // roll back only this task, so concurrent realtime updates to others survive
        set((s) => ({
          tasks: { ...s.tasks, data: (s.tasks.data ?? []).map((x) => (x.id === id ? task : x)) },
        }));
        useToast.getState().push(t('state.undone'));
        if (err instanceof NetworkError) set({ offline: true });
        else if (!(err instanceof ApiError)) throw err;
      }
    },

    applyMessage(msg) {
      switch (msg.type) {
        case 'task.changed':
          set((s) => {
            const list = s.tasks.data ?? [];
            const exists = list.some((x) => x.id === msg.payload.id);
            return {
              tasks: {
                ...s.tasks,
                status: 'ready',
                data: exists
                  ? list.map((x) => (x.id === msg.payload.id ? msg.payload : x))
                  : [...list, msg.payload],
              },
            };
          });
          break;
        case 'task.deleted':
          set((s) => ({
            tasks: {
              ...s.tasks,
              data: (s.tasks.data ?? []).filter((x) => x.id !== msg.payload.id),
            },
          }));
          break;
        case 'notification.created':
          set((s) =>
            s.dashboard.data
              ? {
                  dashboard: {
                    ...s.dashboard,
                    data: {
                      ...s.dashboard.data,
                      unreadNotifications: s.dashboard.data.unreadNotifications + 1,
                    },
                  },
                }
              : {},
          );
          break;
        case 'notifications.read':
          void loadSlice('dashboard');
          break;
        case 'settings.changed':
          useSession.getState().setSettings(msg.payload);
          break;
        default:
          break;
      }
    },

    reset: () =>
      set({
        tasks: empty(),
        dashboard: empty(),
        currency: empty(),
        weather: empty(),
        offline: false,
      }),
  };
});

/** Task counters for the KPI row: from the live task list when we have it, else the server's dashboard numbers. */
export function selectStats(state: Pick<DataState, 'tasks' | 'dashboard'>, now: Date) {
  if (state.tasks.data) return computeTaskStats(state.tasks.data, now);
  return state.dashboard.data?.tasks ?? null;
}

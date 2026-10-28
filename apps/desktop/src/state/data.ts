import { create } from 'zustand';
import type {
  CurrencyWidget,
  DashboardInfo,
  NotificationItem,
  ServerMessage,
  Task,
  WeatherWidget,
} from '@ish-maydoni/shared';
import { ApiError, NetworkError } from '../lib/api';
import { readCache, writeCache } from '../lib/cache';
import { api } from '../lib/client';
import {
  demoCurrency,
  demoDashboard,
  demoNotifications,
  demoTasks,
  demoWeather,
} from '../lib/demoData';
import { notifyDesktop } from '../lib/desktopNotify';
import { adoptServerSettings, flushSettings } from '../lib/settingsSync';
import { DEFAULT_SETTINGS, showSystemNotification } from '../lib/settings';
import { computeTaskStats } from '../lib/home';
import {
  enqueue,
  loadQueue,
  pendingIds,
  remapTaskId,
  saveQueue,
  type CreatePayload,
  type PatchPayload,
  type QueueOp,
} from '../lib/queue';
import { t } from '../lib/i18n';
import { useSession } from './session';
import { useToast } from './toast';

export interface Slice<T> {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: T | null;
  updatedAt: number | null;
}

const empty = <T>(): Slice<T> => ({ status: 'idle', data: null, updatedAt: null });

export interface NotificationsData {
  items: NotificationItem[];
  unread: number;
}

export interface TaskInput {
  title: string;
  notes?: string | null;
  priority?: Task['priority'];
  dueAt?: Date | null;
  assignee?: string | null;
  list?: string | null;
}

export type TaskChanges = Partial<
  Omit<TaskInput, 'title'> & { title: string; status: Task['status'] }
>;

interface DataState {
  /** Changes made offline (or not yet confirmed) waiting to be sent, in order. */
  queue: QueueOp[];
  /** Ids of tasks with unsent changes; shown with a "queued" marker. */
  pending: Set<string>;
  tasks: Slice<Task[]>;
  dashboard: Slice<DashboardInfo>;
  currency: Slice<CurrencyWidget>;
  weather: Slice<WeatherWidget>;
  notifications: Slice<NotificationsData>;
  /** The last core request failed because the server is unreachable. */
  offline: boolean;
  loadAll(): Promise<void>;
  flushQueue(): Promise<void>;
  createTask(input: TaskInput): void;
  updateTask(id: string, changes: TaskChanges): void;
  removeTask(id: string): void;
  toggleTask(id: string): void;
  markRead(ids: string[] | 'all'): void;
  applyMessage(msg: ServerMessage): void;
  reset(): void;
}

type Key = 'tasks' | 'dashboard' | 'currency' | 'weather' | 'notifications';
const PATHS: Record<Key, string> = {
  tasks: '/api/tasks',
  dashboard: '/api/dashboard',
  currency: '/api/widgets/currency',
  weather: '/api/widgets/weather',
  notifications: '/api/notifications?limit=50',
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
      // unsent local changes are newer than the server's copy: keep them until the queue is flushed
      if (key === 'tasks' && get().queue.length > 0 && get().tasks.data !== null) return true;
      writeCache(key, value);
      setSlice(key, { status: 'ready', data: value as never, updatedAt: Date.now() });
      return true;
    } catch (err) {
      if (get()[key].data === null) setSlice(key, { status: 'error' });
      if (err instanceof NetworkError) return false;
      return true; // the server answered (e.g. 503 for a widget): not an offline situation
    }
  }

  const commitTasks = (fn: (list: Task[]) => Task[]) => {
    set((s) => ({
      tasks: {
        ...s.tasks,
        status: 'ready',
        data: fn(s.tasks.data ?? []),
        updatedAt: s.tasks.updatedAt ?? Date.now(),
      },
    }));
    writeCache('tasks', get().tasks.data);
  };
  const setQueue = (queue: QueueOp[]) => {
    saveQueue(queue);
    set({ queue, pending: pendingIds(queue) });
  };
  let inFlight: string | undefined;
  let flushing = false;
  const upsert = (list: Task[], task: Task) =>
    list.some((x) => x.id === task.id)
      ? list.map((x) => (x.id === task.id ? task : x))
      : [...list, task];
  const iso = (d: Date | null | undefined) =>
    d === undefined ? undefined : d ? d.toISOString() : null;
  const toPayload = (c: TaskChanges): PatchPayload => {
    const out: PatchPayload = {};
    if (c.title !== undefined) out.title = c.title;
    if (c.notes !== undefined) out.notes = c.notes;
    if (c.status !== undefined) out.status = c.status;
    if (c.priority !== undefined) out.priority = c.priority;
    if (c.dueAt !== undefined) out.dueAt = iso(c.dueAt);
    if (c.assignee !== undefined) out.assignee = c.assignee;
    if (c.list !== undefined) out.list = c.list;
    return out;
  };
  const submit = (op: QueueOp) => {
    setQueue(enqueue(get().queue, op, inFlight));
    void get().flushQueue();
  };

  async function runOp(op: QueueOp): Promise<void> {
    if (op.type === 'create') {
      const saved = await api.post<Task>('/api/tasks', op.payload);
      // the realtime echo may already have inserted the real task: drop it and the local copy, then add once
      commitTasks((list) =>
        upsert(
          list.filter((x) => x.id !== op.taskId && x.id !== saved.id),
          saved,
        ),
      );
      setQueue(remapTaskId(get().queue, op.taskId, saved.id));
    } else if (op.type === 'patch') {
      const saved = await api.patch<Task>(`/api/tasks/${op.taskId}`, op.payload);
      commitTasks((list) => (list.some((x) => x.id === saved.id) ? upsert(list, saved) : list));
    } else {
      try {
        await api.delete(`/api/tasks/${op.taskId}`);
      } catch (err) {
        if (!(err instanceof ApiError && err.status === 404)) throw err;
      }
    }
  }

  return {
    queue: loadQueue(),
    pending: pendingIds(loadQueue()),
    tasks: empty(),
    dashboard: empty(),
    currency: empty(),
    weather: empty(),
    notifications: empty(),
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
          notifications: {
            status: 'ready',
            data: get().notifications.data ?? demoNotifications(now),
            updatedAt: Date.now(),
          },
        });
        return;
      }
      await get().flushQueue();
      void flushSettings();
      const reached = await Promise.all((Object.keys(PATHS) as Key[]).map(loadSlice));
      set({ offline: reached.some((ok) => !ok) });
    },

    async flushQueue() {
      if (flushing || useSession.getState().demo) return;
      flushing = true;
      let dropped = false;
      try {
        while (get().queue[0]) {
          const op = get().queue[0]!;
          inFlight = op.id;
          try {
            await runOp(op);
            setQueue(get().queue.filter((q) => q.id !== op.id));
            set({ offline: false });
          } catch (err) {
            if (err instanceof NetworkError) {
              if (!get().offline) useToast.getState().push(t('state.queued'));
              set({ offline: true });
              break;
            }
            // the server refused this change (validation, deleted elsewhere…): drop it and resync
            setQueue(get().queue.filter((q) => q.id !== op.id));
            dropped = true;
            useToast.getState().push(t('state.undone'));
          }
        }
      } finally {
        inFlight = undefined;
        flushing = false;
      }
      if (dropped && get().queue.length === 0) {
        await loadSlice('tasks');
      }
    },

    createTask(input) {
      const now = new Date();
      const local: Task = {
        id: `local-${crypto.randomUUID()}`,
        title: input.title,
        notes: input.notes ?? null,
        source: 'PERSONAL',
        status: 'TODO',
        priority: input.priority ?? 'NORMAL',
        dueAt: input.dueAt ? input.dueAt.toISOString() : null,
        assignedBy: null,
        assignee: input.assignee ?? null,
        list: input.list ?? null,
        externalRef: null,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        completedAt: null,
      };
      commitTasks((list) => [...list, local]);
      if (useSession.getState().demo) return;
      const payload: CreatePayload = {
        title: input.title,
        notes: input.notes ?? null,
        priority: input.priority,
        dueAt: local.dueAt,
        assignee: input.assignee ?? null,
        list: input.list ?? null,
      };
      submit({ id: crypto.randomUUID(), type: 'create', taskId: local.id, payload });
    },

    updateTask(id, changes) {
      const now = new Date();
      commitTasks((list) =>
        list.map((x) => {
          if (x.id !== id) return x;
          const status = changes.status ?? x.status;
          return {
            ...x,
            ...(changes.title !== undefined && { title: changes.title }),
            ...(changes.notes !== undefined && { notes: changes.notes }),
            ...(changes.priority !== undefined && { priority: changes.priority }),
            ...(changes.dueAt !== undefined && {
              dueAt: changes.dueAt ? changes.dueAt.toISOString() : null,
            }),
            ...(changes.assignee !== undefined && { assignee: changes.assignee }),
            ...(changes.list !== undefined && { list: changes.list }),
            status,
            completedAt:
              changes.status === undefined
                ? x.completedAt
                : status === 'DONE'
                  ? (x.completedAt ?? now.toISOString())
                  : null,
            updatedAt: now.toISOString(),
          };
        }),
      );
      if (useSession.getState().demo) return;
      submit({ id: crypto.randomUUID(), type: 'patch', taskId: id, payload: toPayload(changes) });
    },

    removeTask(id) {
      commitTasks((list) => list.filter((x) => x.id !== id));
      if (useSession.getState().demo) return;
      submit({ id: crypto.randomUUID(), type: 'delete', taskId: id });
    },

    markRead(ids) {
      const now = new Date().toISOString();
      set((s) => {
        const cur = s.notifications.data;
        if (!cur) return {};
        const items = cur.items.map((n) =>
          n.readAt === null && (ids === 'all' || ids.includes(n.id)) ? { ...n, readAt: now } : n,
        );
        return {
          notifications: {
            ...s.notifications,
            data: { items, unread: items.filter((n) => n.readAt === null).length },
          },
        };
      });
      if (useSession.getState().demo) return;
      api.post('/api/notifications/read', { ids }).catch(() => {
        // the server did not take it: show the real state again
        void loadSlice('notifications');
      });
    },

    toggleTask(id) {
      const task = get().tasks.data?.find((x) => x.id === id);
      if (task) get().updateTask(id, { status: task.status === 'DONE' ? 'TODO' : 'DONE' });
    },

    applyMessage(msg) {
      switch (msg.type) {
        case 'task.changed':
          if (get().pending.has(msg.payload.id)) break;
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
          if (get().pending.has(msg.payload.id)) break;
          set((s) => ({
            tasks: {
              ...s.tasks,
              data: (s.tasks.data ?? []).filter((x) => x.id !== msg.payload.id),
            },
          }));
          break;
        case 'notification.created': {
          const n = msg.payload;
          set((s) => {
            const cur = s.notifications.data ?? { items: [], unread: 0 };
            if (cur.items.some((x) => x.id === n.id)) return {};
            const items = [n, ...cur.items];
            return {
              notifications: {
                ...s.notifications,
                status: 'ready',
                data: { items, unread: items.filter((x) => x.readAt === null).length },
              },
            };
          });
          const settings = { ...DEFAULT_SETTINGS, ...useSession.getState().settings };
          if (showSystemNotification(n.category, settings, new Date()))
            void notifyDesktop(n.title, n.body);
          break;
        }
        case 'notifications.read':
          void loadSlice('notifications');
          break;
        case 'settings.changed':
          adoptServerSettings(msg.payload);
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
        notifications: empty(),
        offline: false,
      }),
  };
});

/** Task counters for the KPI row: from the live task list when we have it, else the server's dashboard numbers. */
export function selectStats(state: Pick<DataState, 'tasks' | 'dashboard'>, now: Date) {
  if (state.tasks.data) return computeTaskStats(state.tasks.data, now);
  return state.dashboard.data?.tasks ?? null;
}

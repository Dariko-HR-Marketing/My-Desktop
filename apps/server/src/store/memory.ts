import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { NotificationItem, Task, UserSettings } from '@ish-maydoni/shared';
import type { UserRecord } from '../domain/types.js';
import { APP_CATALOG, DEFAULT_SETTINGS, MODULE_CATALOG } from './catalog.js';
import {
  completedAtFor,
  type NewNotification,
  type NewTask,
  type Store,
  type TaskFilter,
  type TaskPatch,
} from './store.js';

export interface MemoryStoreOptions {
  bcryptRounds?: number;
  demoPassword?: string;
  /** Seed demo tasks and notifications (relative to `now`). */
  demoData?: boolean;
  now?: () => Date;
}

const DEMO_USERS: Omit<UserRecord, 'id' | 'passwordHash'>[] = [
  {
    login: 'xodim',
    fullName: 'Aziz Karimov',
    position: 'Yetakchi mutaxassis',
    department: 'Kadrlar boʻlimi',
    role: 'EMPLOYEE',
  },
  {
    login: 'rahbar',
    fullName: 'Dilshod Rahimov',
    position: 'Boʻlim boshligʻi',
    department: 'Kadrlar boʻlimi',
    role: 'MANAGER',
  },
  {
    login: 'admin',
    fullName: 'Admin Administratorov',
    position: 'IT administrator',
    department: 'IT',
    role: 'ADMIN',
  },
];

const hoursFrom = (base: Date, h: number) => new Date(base.getTime() + h * 3_600_000);

export function createMemoryStore(opts: MemoryStoreOptions = {}): Store {
  const now = opts.now ?? (() => new Date());
  const rounds = opts.bcryptRounds ?? 12;
  const password = opts.demoPassword ?? 'demo12345';
  const hash = bcrypt.hashSync(password, rounds);

  const users: UserRecord[] = DEMO_USERS.map((u) => ({
    ...u,
    id: randomUUID(),
    passwordHash: hash,
  }));
  const tasks = new Map<string, Task & { userId: string }>();
  const notifications = new Map<string, NotificationItem & { userId: string }>();
  const settings = new Map<string, UserSettings>();

  const makeTask = (userId: string, input: NewTask): Task & { userId: string } => {
    const t = now().toISOString();
    return {
      id: randomUUID(),
      userId,
      title: input.title,
      notes: input.notes ?? null,
      source: input.source ?? 'PERSONAL',
      status: 'TODO',
      priority: input.priority ?? 'NORMAL',
      dueAt: input.dueAt ? input.dueAt.toISOString() : null,
      assignedBy: input.assignedBy ?? null,
      assignee: input.assignee ?? null,
      list: input.list ?? null,
      externalRef: input.externalRef ?? null,
      createdAt: t,
      updatedAt: t,
      completedAt: null,
    };
  };

  const makeNotification = (userId: string, input: NewNotification, createdAt = now()) => ({
    id: randomUUID(),
    userId,
    category: input.category,
    title: input.title,
    body: input.body ?? '',
    actionLabel: input.actionLabel ?? null,
    actionUrl: input.actionUrl ?? null,
    readAt: null,
    createdAt: createdAt.toISOString(),
  });

  if (opts.demoData ?? true) {
    const base = now();
    for (const u of users) {
      const seedTasks: NewTask[] = [
        {
          title: 'Oylik hisobotni tayyorlash',
          priority: 'HIGH',
          source: 'PLAN',
          dueAt: hoursFrom(base, -20),
        },
        {
          title: '03-12/458-sonli xatga javob yozish',
          priority: 'HIGH',
          source: 'MODULE',
          dueAt: hoursFrom(base, 2),
          externalRef: 'edo:doc:03-12/458',
        },
        {
          title: 'Boʻlim yigʻilishiga tayyorlanish',
          source: 'MANAGER',
          assignedBy: 'Dilshod Rahimov',
          dueAt: hoursFrom(base, 4),
        },
        {
          title: 'Yangi xodim uchun hujjatlarni yigʻish',
          priority: 'LOW',
          source: 'PERSONAL',
          dueAt: hoursFrom(base, 48),
        },
        { title: 'Reja boʻyicha qoʻngʻiroqlar', source: 'PLAN' },
      ];
      for (const s of seedTasks) {
        const t = makeTask(u.id, s);
        tasks.set(t.id, t);
      }
      const seedNotifs: NewNotification[] = [
        {
          category: 'WORK',
          title: 'Imzo kutilmoqda',
          body: '03-12/458 — buyruq loyihasi',
          actionLabel: 'Imzolash',
          actionUrl: 'module://edo/documents',
        },
        {
          category: 'MESSAGE',
          title: 'Telegram',
          body: '3 ta yangi xabar',
          actionLabel: 'Ochish',
          actionUrl: 'https://web.telegram.org/a/',
        },
        { category: 'SYSTEM', title: 'Dastur yangilandi', body: 'Ish maydoni 0.1.0' },
      ];
      seedNotifs.forEach((n, i) => {
        const item = makeNotification(u.id, n, hoursFrom(base, -(i + 1)));
        notifications.set(item.id, item);
      });
    }
  }

  const strip = <T extends { userId: string }>({ userId: _u, ...rest }: T): Omit<T, 'userId'> =>
    rest;

  const store: Store = {
    kind: 'memory',
    users: {
      findByLogin: async (login) => users.find((u) => u.login === login) ?? null,
      findById: async (id) => users.find((u) => u.id === id) ?? null,
    },
    tasks: {
      async list(userId, filter: TaskFilter = {}) {
        const items = [...tasks.values()].filter((t) => {
          if (t.userId !== userId) return false;
          if (filter.statuses && !filter.statuses.includes(t.status)) return false;
          if (filter.dueBefore && !(t.dueAt && new Date(t.dueAt) < filter.dueBefore)) return false;
          return true;
        });
        items.sort((a, b) => {
          if (a.dueAt === b.dueAt) return a.createdAt.localeCompare(b.createdAt);
          if (a.dueAt === null) return 1;
          if (b.dueAt === null) return -1;
          return a.dueAt.localeCompare(b.dueAt);
        });
        return items.map(strip);
      },
      async create(userId, input) {
        const t = makeTask(userId, input);
        tasks.set(t.id, t);
        return strip(t);
      },
      async update(userId, id, patch: TaskPatch) {
        const t = tasks.get(id);
        if (!t || t.userId !== userId) return null;
        const at = now();
        const completed = completedAtFor(
          patch.status,
          t.completedAt ? new Date(t.completedAt) : null,
          at,
        );
        const next = {
          ...t,
          ...(patch.title !== undefined && { title: patch.title }),
          ...(patch.notes !== undefined && { notes: patch.notes }),
          ...(patch.status !== undefined && { status: patch.status }),
          ...(patch.priority !== undefined && { priority: patch.priority }),
          ...(patch.dueAt !== undefined && {
            dueAt: patch.dueAt ? patch.dueAt.toISOString() : null,
          }),
          ...(patch.assignee !== undefined && { assignee: patch.assignee }),
          ...(patch.list !== undefined && { list: patch.list }),
          completedAt: completed ? completed.toISOString() : null,
          updatedAt: at.toISOString(),
        };
        tasks.set(id, next);
        return strip(next);
      },
      async remove(userId, id) {
        const t = tasks.get(id);
        if (!t || t.userId !== userId) return false;
        return tasks.delete(id);
      },
    },
    notifications: {
      async list(userId, { unreadOnly, limit = 50 }) {
        return [...notifications.values()]
          .filter((n) => n.userId === userId && (!unreadOnly || n.readAt === null))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, limit)
          .map(strip);
      },
      async unreadCount(userId) {
        return [...notifications.values()].filter((n) => n.userId === userId && n.readAt === null)
          .length;
      },
      async markRead(userId, ids) {
        let count = 0;
        const at = now().toISOString();
        for (const n of notifications.values()) {
          if (n.userId !== userId || n.readAt !== null) continue;
          if (ids === 'all' || ids.includes(n.id)) {
            n.readAt = at;
            count++;
          }
        }
        return count;
      },
      async create(userId, input) {
        const n = makeNotification(userId, input, now());
        notifications.set(n.id, n);
        return strip(n);
      },
    },
    settings: {
      async get(userId) {
        return (
          settings.get(userId) ?? {
            ...DEFAULT_SETTINGS,
            pinnedApps: [...DEFAULT_SETTINGS.pinnedApps],
          }
        );
      },
      async update(userId, patch) {
        const next = { ...(await store.settings.get(userId)), ...patch };
        settings.set(userId, next);
        return next;
      },
    },
    catalog: {
      apps: async () => [...APP_CATALOG].sort((a, b) => a.order - b.order),
      modules: async () => [...MODULE_CATALOG],
    },
    close: async () => {},
  };
  return store;
}

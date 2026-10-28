import { PrismaClient, type Prisma } from '@prisma/client';
import type { NotificationItem, Task, UserSettings } from '@ish-maydoni/shared';
import type { UserRecord } from '../domain/types.js';
import { APP_CATALOG, DEFAULT_SETTINGS, MODULE_CATALOG } from './catalog.js';
import { completedAtFor, type Store } from './store.js';

type TaskRow = Prisma.TaskGetPayload<object>;
type NotificationRow = Prisma.NotificationGetPayload<object>;

const toTask = (r: TaskRow): Task => ({
  id: r.id,
  title: r.title,
  notes: r.notes,
  source: r.source,
  status: r.status,
  priority: r.priority,
  dueAt: r.dueAt?.toISOString() ?? null,
  assignedBy: r.assignedBy,
  assignee: r.assignee,
  list: r.list,
  externalRef: r.externalRef,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
  completedAt: r.completedAt?.toISOString() ?? null,
});

const toNotification = (r: NotificationRow): NotificationItem => ({
  id: r.id,
  category: r.category,
  title: r.title,
  body: r.body,
  actionLabel: r.actionLabel,
  actionUrl: r.actionUrl,
  readAt: r.readAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
});

const toUser = (r: UserRecord): UserRecord => ({
  id: r.id,
  login: r.login,
  fullName: r.fullName,
  position: r.position,
  department: r.department,
  role: r.role,
  passwordHash: r.passwordHash,
});

export function createPrismaStore(databaseUrl: string): Store {
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  const readSettings = (row: {
    theme: string;
    density: string;
    language: string;
    pinnedApps: string[];
    navCollapsed: boolean;
  }) =>
    ({
      theme: row.theme,
      density: row.density,
      language: row.language,
      pinnedApps: row.pinnedApps,
      navCollapsed: row.navCollapsed,
    }) as UserSettings;

  return {
    kind: 'postgres',
    users: {
      async findByLogin(login) {
        const r = await db.user.findUnique({ where: { login } });
        return r ? toUser(r) : null;
      },
      async findById(id) {
        const r = await db.user.findUnique({ where: { id } });
        return r ? toUser(r) : null;
      },
    },
    tasks: {
      async list(userId, filter = {}) {
        const rows = await db.task.findMany({
          where: {
            userId,
            ...(filter.statuses && { status: { in: filter.statuses } }),
            ...(filter.dueBefore && { dueAt: { lt: filter.dueBefore } }),
          },
          orderBy: [{ dueAt: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
        });
        return rows.map(toTask);
      },
      async create(userId, input) {
        const r = await db.task.create({
          data: {
            userId,
            title: input.title,
            notes: input.notes ?? null,
            source: input.source ?? 'PERSONAL',
            priority: input.priority ?? 'NORMAL',
            dueAt: input.dueAt ?? null,
            assignedBy: input.assignedBy ?? null,
            assignee: input.assignee ?? null,
            list: input.list ?? null,
            externalRef: input.externalRef ?? null,
          },
        });
        return toTask(r);
      },
      async update(userId, id, patch) {
        const current = await db.task.findFirst({ where: { id, userId } });
        if (!current) return null;
        const r = await db.task.update({
          where: { id },
          data: {
            ...(patch.title !== undefined && { title: patch.title }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
            ...(patch.status !== undefined && { status: patch.status }),
            ...(patch.priority !== undefined && { priority: patch.priority }),
            ...(patch.dueAt !== undefined && { dueAt: patch.dueAt }),
            ...(patch.assignee !== undefined && { assignee: patch.assignee }),
            ...(patch.list !== undefined && { list: patch.list }),
            completedAt: completedAtFor(patch.status, current.completedAt, new Date()),
          },
        });
        return toTask(r);
      },
      async remove(userId, id) {
        const res = await db.task.deleteMany({ where: { id, userId } });
        return res.count > 0;
      },
    },
    notifications: {
      async list(userId, { unreadOnly, limit = 50 }) {
        const rows = await db.notification.findMany({
          where: { userId, ...(unreadOnly && { readAt: null }) },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
        return rows.map(toNotification);
      },
      unreadCount: (userId) => db.notification.count({ where: { userId, readAt: null } }),
      async markRead(userId, ids) {
        const res = await db.notification.updateMany({
          where: { userId, readAt: null, ...(ids !== 'all' && { id: { in: ids } }) },
          data: { readAt: new Date() },
        });
        return res.count;
      },
      async create(userId, input) {
        const r = await db.notification.create({
          data: {
            userId,
            category: input.category,
            title: input.title,
            body: input.body ?? '',
            actionLabel: input.actionLabel ?? null,
            actionUrl: input.actionUrl ?? null,
          },
        });
        return toNotification(r);
      },
    },
    settings: {
      async get(userId) {
        const r = await db.userSettings.findUnique({ where: { userId } });
        return r
          ? readSettings(r)
          : { ...DEFAULT_SETTINGS, pinnedApps: [...DEFAULT_SETTINGS.pinnedApps] };
      },
      async update(userId, patch) {
        const r = await db.userSettings.upsert({
          where: { userId },
          create: { userId, ...patch },
          update: patch,
        });
        return readSettings(r);
      },
    },
    catalog: {
      async apps() {
        const rows = await db.appLink.findMany({ orderBy: { order: 'asc' } });
        return rows.length ? (rows as typeof APP_CATALOG) : APP_CATALOG;
      },
      async modules() {
        const rows = await db.module.findMany();
        return rows.length ? rows : MODULE_CATALOG;
      },
    },
    close: () => db.$disconnect(),
  };
}

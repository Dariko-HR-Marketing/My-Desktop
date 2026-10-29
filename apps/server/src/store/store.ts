import type {
  AppLink,
  ModuleInfo,
  NotificationCategory,
  NotificationItem,
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
  UserSettings,
} from '@ish-maydoni/shared';
import type { UserRecord } from '../domain/types.js';

export interface IntegrationRow {
  ownerId: string;
  providerKey: string;
  /** Encrypted JSON of the credential fields (see services/vault.ts). */
  dataEnc: string;
  lastTestOk: boolean | null;
  lastTestAt: Date | null;
  lastTestMessage: string | null;
  updatedAt: Date;
}

export interface TaskFilter {
  statuses?: TaskStatus[];
  dueBefore?: Date;
}

export interface NewTask {
  title: string;
  notes?: string | null;
  source?: TaskSource;
  priority?: TaskPriority;
  dueAt?: Date | null;
  assignedBy?: string | null;
  assignee?: string | null;
  list?: string | null;
  externalRef?: string | null;
}

export interface TaskPatch {
  title?: string;
  notes?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueAt?: Date | null;
  assignee?: string | null;
  list?: string | null;
}

export interface NewNotification {
  category: NotificationCategory;
  title: string;
  body?: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
}

/** Persistence boundary. `memory` is used for demo mode and tests, `prisma` in production. */
export interface Store {
  readonly kind: 'memory' | 'postgres';
  users: {
    findByLogin(login: string): Promise<UserRecord | null>;
    findById(id: string): Promise<UserRecord | null>;
  };
  tasks: {
    list(userId: string, filter?: TaskFilter): Promise<Task[]>;
    create(userId: string, input: NewTask): Promise<Task>;
    update(userId: string, id: string, patch: TaskPatch): Promise<Task | null>;
    remove(userId: string, id: string): Promise<boolean>;
  };
  notifications: {
    list(
      userId: string,
      opts: { unreadOnly?: boolean; limit?: number },
    ): Promise<NotificationItem[]>;
    unreadCount(userId: string): Promise<number>;
    markRead(userId: string, ids: string[] | 'all'): Promise<number>;
    create(userId: string, input: NewNotification): Promise<NotificationItem>;
  };
  settings: {
    get(userId: string): Promise<UserSettings>;
    update(userId: string, patch: Partial<UserSettings>): Promise<UserSettings>;
  };
  integrations: {
    get(ownerId: string, providerKey: string): Promise<IntegrationRow | null>;
    /** Replaces the credentials and clears the last test result. */
    upsert(ownerId: string, providerKey: string, dataEnc: string, at: Date): Promise<void>;
    remove(ownerId: string, providerKey: string): Promise<boolean>;
    setTest(
      ownerId: string,
      providerKey: string,
      ok: boolean,
      message: string,
      at: Date,
    ): Promise<void>;
  };
  catalog: {
    apps(): Promise<AppLink[]>;
    modules(): Promise<ModuleInfo[]>;
  };
  close(): Promise<void>;
}

export const OPEN_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS'];

/** completedAt follows status: set on DONE, cleared when reopened. */
export function completedAtFor(
  status: TaskStatus | undefined,
  current: Date | null,
  now: Date,
): Date | null {
  if (status === undefined) return current;
  if (status === 'DONE') return current ?? now;
  return null;
}

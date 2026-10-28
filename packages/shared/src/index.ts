export const ROLES = ['EMPLOYEE', 'MANAGER', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'NORMAL', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_SOURCES = ['PLAN', 'MANAGER', 'PERSONAL', 'MODULE'] as const;
export type TaskSource = (typeof TASK_SOURCES)[number];

export const NOTIFICATION_CATEGORIES = ['WORK', 'MESSAGE', 'SYSTEM'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const THEMES = ['light', 'dark', 'system'] as const;
export const DENSITIES = ['comfortable', 'compact'] as const;
export const LANGUAGES = ['uz-Latn', 'uz-Cyrl', 'ru', 'en'] as const;

export const APP_CATEGORIES = ['MESSENGER', 'SOCIAL', 'VIDEO', 'WORK', 'GOV', 'SEARCH'] as const;
export type AppCategory = (typeof APP_CATEGORIES)[number];

export interface User {
  id: string;
  login: string;
  fullName: string;
  position: string;
  department: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  notes: string | null;
  source: TaskSource;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  assignedBy: string | null;
  externalRef: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  actionLabel: string | null;
  actionUrl: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface UserSettings {
  theme: (typeof THEMES)[number];
  density: (typeof DENSITIES)[number];
  language: (typeof LANGUAGES)[number];
  pinnedApps: string[];
  navCollapsed: boolean;
}

export interface AppLink {
  key: string;
  name: string;
  url: string;
  category: AppCategory;
  color: string;
  mandatory: boolean;
  order: number;
}

export interface ModuleInfo {
  key: string;
  name: string;
  description: string;
  roles: Role[];
  version: string;
}

export interface ModuleSignal {
  moduleKey: string;
  label: string;
  count: number;
  tone: 'info' | 'warning' | 'danger';
  /** e.g. module://edo/documents */
  url: string;
}

export interface DashboardInfo {
  tasks: { today: number; todayDone: number; open: number; overdue: number };
  unreadNotifications: number;
  signals: ModuleSignal[];
  generatedAt: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  diff: number;
  date: string;
}

export interface CurrencyWidget {
  items: CurrencyRate[];
  fetchedAt: string;
  stale: boolean;
  source: 'Markaziy bank';
}

export interface WeatherWidget {
  city: string;
  temperature: number;
  weatherCode: number;
  description: string;
  tomorrowMax: number;
  fetchedAt: string;
  stale: boolean;
}

export interface ApiErrorBody {
  error: string;
  message: string;
  issues?: { path: string; message: string }[];
}

export type ServerMessage =
  | { type: 'hello'; payload: { userId: string } }
  | { type: 'notification.created'; payload: NotificationItem }
  | { type: 'notifications.read'; payload: { count: number } }
  | { type: 'task.changed'; payload: Task }
  | { type: 'task.deleted'; payload: { id: string } }
  | { type: 'settings.changed'; payload: UserSettings };

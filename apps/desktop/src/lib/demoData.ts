import type {
  CurrencyWidget,
  DashboardInfo,
  Task,
  User,
  UserSettings,
  WeatherWidget,
} from '@ish-maydoni/shared';
import { computeTaskStats } from './home';

const hours = (base: Date, h: number) => new Date(base.getTime() + h * 3_600_000).toISOString();

export const DEMO_USER: User = {
  id: 'demo',
  login: 'demo',
  fullName: 'Demo Foydalanuvchi',
  position: 'Xodim',
  department: 'Demo',
  role: 'EMPLOYEE',
};

export const DEMO_SETTINGS: UserSettings = {
  theme: 'system',
  density: 'comfortable',
  language: 'uz-Latn',
  pinnedApps: ['telegram', 'whatsapp', 'instagram', 'youtube'],
  navCollapsed: false,
};

export function demoTasks(now: Date): Task[] {
  const mk = (
    i: number,
    title: string,
    source: Task['source'],
    priority: Task['priority'],
    due: number | null,
  ): Task => ({
    id: `demo-${i}`,
    title,
    notes: null,
    source,
    status: 'TODO',
    priority,
    dueAt: due === null ? null : hours(now, due),
    assignedBy: source === 'MANAGER' ? 'Dilshod Rahimov' : null,
    assignee: null,
    list: null,
    externalRef: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    completedAt: null,
  });
  return [
    mk(1, 'Oylik hisobotni tayyorlash', 'PLAN', 'HIGH', -20),
    mk(2, '03-12/458-sonli xatga javob yozish', 'MODULE', 'HIGH', 1),
    mk(3, 'Boʻlim yigʻilishiga tayyorlanish', 'MANAGER', 'NORMAL', 2),
    mk(4, 'Yangi xodim uchun hujjatlarni yigʻish', 'PERSONAL', 'LOW', 48),
    mk(5, 'Reja boʻyicha qoʻngʻiroqlar', 'PLAN', 'NORMAL', null),
  ];
}

export function demoDashboard(tasks: Task[], now: Date): DashboardInfo {
  return {
    tasks: computeTaskStats(tasks, now),
    unreadNotifications: 3,
    signals: [
      {
        moduleKey: 'edo',
        label: 'Imzo kutmoqda',
        count: 4,
        tone: 'warning',
        url: 'module://edo/documents',
      },
      {
        moduleKey: 'edo',
        label: 'Muddati oʻtgan',
        count: 2,
        tone: 'danger',
        url: 'module://edo/control',
      },
    ],
    generatedAt: now.toISOString(),
  };
}

export const demoCurrency = (now: Date): CurrencyWidget => ({
  items: [
    { code: 'USD', name: 'AQSH dollari', rate: 12650.5, diff: -12.3, date: '' },
    { code: 'EUR', name: 'EVRO', rate: 14700, diff: 5.1, date: '' },
    { code: 'RUB', name: 'Rossiya rubli', rate: 135.2, diff: 0.4, date: '' },
  ],
  fetchedAt: now.toISOString(),
  stale: false,
  source: 'Markaziy bank',
});

export const demoWeather = (now: Date): WeatherWidget => ({
  city: 'Toshkent',
  temperature: 14,
  weatherCode: 3,
  description: 'Bulutli',
  tomorrowMax: 18,
  fetchedAt: now.toISOString(),
  stale: false,
});

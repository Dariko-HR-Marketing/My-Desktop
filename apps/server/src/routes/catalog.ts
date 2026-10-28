import type { FastifyInstance } from 'fastify';
import { httpError } from '../errors.js';
import { WidgetUnavailableError } from '../services/widgets.js';
import { collectSignals } from '../modules/registry.js';
import type { Deps } from '../app.js';
import type { CalendarToday, DashboardInfo } from '@ish-maydoni/shared';
import { CalendarUnavailableError } from '../services/calendar.js';
import { OPEN_STATUSES } from '../store/store.js';

// Business day boundaries use Tashkent time (UTC+5, no DST).
const TZ_OFFSET_MS = 5 * 3_600_000;

export function dayBoundsTashkent(now: Date): { start: Date; end: Date } {
  const local = new Date(now.getTime() + TZ_OFFSET_MS);
  const startLocal = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const start = new Date(startLocal - TZ_OFFSET_MS);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

export function catalogRoutes(
  app: FastifyInstance,
  { store, widgets, adapters, now, calendar }: Deps,
) {
  const auth = { preHandler: app.authenticate };

  app.get('/api/catalog/apps', auth, async () => ({ items: await store.catalog.apps() }));

  app.get('/api/catalog/modules', auth, async (req) => ({
    items: (await store.catalog.modules()).filter((m) => m.roles.includes(req.user.role)),
  }));

  const widget =
    <T>(fn: () => Promise<T>) =>
    async (_req: unknown, reply: { code(n: number): { send(b: unknown): unknown } }) => {
      try {
        return await fn();
      } catch (err) {
        if (err instanceof WidgetUnavailableError) {
          return reply.code(503).send({ error: 'unavailable', message: err.message });
        }
        throw err;
      }
    };
  app.get(
    '/api/widgets/currency',
    auth,
    widget(() => widgets.currency()),
  );
  app.get(
    '/api/widgets/weather',
    auth,
    widget(() => widgets.weather()),
  );

  // Module screens: GET /api/modules/:key/data. 404 for unknown modules, 403 when the role may not use it.
  app.get('/api/modules/:key/data', auth, async (req) => {
    const { key } = req.params as { key: string };
    const module = (await store.catalog.modules()).find((m) => m.key === key);
    const adapter = adapters.find((a) => a.key === key);
    if (!module || !adapter?.data) throw httpError(404, 'not_found', 'Modul topilmadi');
    if (!module.roles.includes(req.user.role))
      throw httpError(403, 'forbidden', 'Bu modulga ruxsat yoʻq');
    return adapter.data({ userId: req.user.sub, role: req.user.role });
  });

  // Today's events from the user's own calendar (secret .ics address kept in their settings).
  app.get('/api/calendar/today', auth, async (req): Promise<CalendarToday> => {
    const { calendarUrl } = await store.settings.get(req.user.sub);
    if (!calendarUrl) return { configured: false, items: [], fetchedAt: null, stale: false };
    const { start, end } = dayBoundsTashkent(now());
    try {
      return await calendar.today(calendarUrl, start, end);
    } catch (err) {
      if (err instanceof CalendarUnavailableError) throw httpError(503, 'unavailable', err.message);
      throw err;
    }
  });

  app.get('/api/dashboard', auth, async (req): Promise<DashboardInfo> => {
    const at = now();
    const { start, end } = dayBoundsTashkent(at);
    const userId = req.user.sub;
    const [tasks, unread, modules] = await Promise.all([
      store.tasks.list(userId),
      store.notifications.unreadCount(userId),
      store.catalog.modules(),
    ]);
    const open = tasks.filter((t) => OPEN_STATUSES.includes(t.status));
    const dueToday = tasks.filter(
      (t) =>
        t.status !== 'CANCELLED' &&
        t.dueAt &&
        new Date(t.dueAt) >= start &&
        new Date(t.dueAt) < end,
    );
    const allowed = new Set(
      modules.filter((m) => m.roles.includes(req.user.role)).map((m) => m.key),
    );
    return {
      tasks: {
        today: dueToday.length,
        todayDone: dueToday.filter((t) => t.status === 'DONE').length,
        open: open.length,
        overdue: open.filter((t) => t.dueAt && new Date(t.dueAt) < at).length,
      },
      unreadNotifications: unread,
      signals: await collectSignals(adapters, allowed, { userId, role: req.user.role }),
      generatedAt: at.toISOString(),
    };
  });
}

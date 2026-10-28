import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NOTIFICATION_CATEGORIES } from '@ish-maydoni/shared';
import { httpError } from '../errors.js';
import type { Deps } from '../app.js';

const listQuery = z.object({
  unread: z.enum(['0', '1']).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const readBody = z.object({
  ids: z.union([z.array(z.string().max(100)).max(500), z.literal('all')]),
});

const createBody = z.object({
  userId: z.string().min(1).max(100),
  category: z.enum(NOTIFICATION_CATEGORIES),
  title: z.string().trim().min(1).max(300),
  body: z.string().max(5000).optional(),
  actionLabel: z.string().max(100).nullish(),
  actionUrl: z.string().max(2000).nullish(),
});

export function notificationRoutes(app: FastifyInstance, { store, hub }: Deps) {
  const auth = { preHandler: app.authenticate };

  app.get('/api/notifications', auth, async (req) => {
    const q = listQuery.parse(req.query);
    const [items, unread] = await Promise.all([
      store.notifications.list(req.user.sub, { unreadOnly: q.unread === '1', limit: q.limit }),
      store.notifications.unreadCount(req.user.sub),
    ]);
    return { items, unread };
  });

  app.post('/api/notifications/read', auth, async (req) => {
    const { ids } = readBody.parse(req.body);
    const count = await store.notifications.markRead(req.user.sub, ids);
    hub.publish(req.user.sub, { type: 'notifications.read', payload: { count } });
    return { count };
  });

  app.post('/api/notifications', auth, async (req, reply) => {
    if (req.user.role !== 'MANAGER' && req.user.role !== 'ADMIN') {
      throw httpError(403, 'forbidden', 'Bildirishnoma yuborish uchun ruxsat yoʻq');
    }
    const body = createBody.parse(req.body);
    if (!(await store.users.findById(body.userId)))
      throw httpError(404, 'not_found', 'Xodim topilmadi');
    const item = await store.notifications.create(body.userId, body);
    hub.publish(body.userId, { type: 'notification.created', payload: item });
    return reply.code(201).send(item);
  });
}

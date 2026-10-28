import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { TASK_PRIORITIES, TASK_SOURCES, TASK_STATUSES } from '@ish-maydoni/shared';
import { httpError } from '../errors.js';
import type { Deps } from '../app.js';

const isoDate = z
  .string()
  .datetime({ offset: true })
  .transform((s) => new Date(s));

const createBody = z.object({
  title: z.string().trim().min(1).max(500),
  notes: z.string().max(10_000).nullish(),
  source: z.enum(TASK_SOURCES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueAt: isoDate.nullish(),
});

const patchBody = z
  .object({
    title: z.string().trim().min(1).max(500),
    notes: z.string().max(10_000).nullable(),
    status: z.enum(TASK_STATUSES),
    priority: z.enum(TASK_PRIORITIES),
    dueAt: isoDate.nullable(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Kamida bitta maydon kerak' });

const listQuery = z.object({
  status: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',') : undefined))
    .pipe(z.array(z.enum(TASK_STATUSES)).optional()),
  dueBefore: isoDate.optional(),
});

const idParams = z.object({ id: z.string().min(1).max(100) });

export function taskRoutes(app: FastifyInstance, { store, hub }: Deps) {
  const auth = { preHandler: app.authenticate };

  app.get('/api/tasks', auth, async (req) => {
    const q = listQuery.parse(req.query);
    return {
      items: await store.tasks.list(req.user.sub, { statuses: q.status, dueBefore: q.dueBefore }),
    };
  });

  app.post('/api/tasks', auth, async (req, reply) => {
    const body = createBody.parse(req.body);
    const task = await store.tasks.create(req.user.sub, {
      title: body.title,
      notes: body.notes ?? null,
      source: body.source,
      priority: body.priority,
      dueAt: body.dueAt ?? null,
    });
    hub.publish(req.user.sub, { type: 'task.changed', payload: task });
    return reply.code(201).send(task);
  });

  app.patch('/api/tasks/:id', auth, async (req) => {
    const { id } = idParams.parse(req.params);
    const task = await store.tasks.update(req.user.sub, id, patchBody.parse(req.body));
    if (!task) throw httpError(404, 'not_found', 'Vazifa topilmadi');
    hub.publish(req.user.sub, { type: 'task.changed', payload: task });
    return task;
  });

  app.delete('/api/tasks/:id', auth, async (req, reply) => {
    const { id } = idParams.parse(req.params);
    if (!(await store.tasks.remove(req.user.sub, id)))
      throw httpError(404, 'not_found', 'Vazifa topilmadi');
    hub.publish(req.user.sub, { type: 'task.deleted', payload: { id } });
    return reply.code(204).send();
  });
}

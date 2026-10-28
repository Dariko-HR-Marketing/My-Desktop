import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { loadConfig, type Config } from './config.js';
import { errorHandler } from './errors.js';
import { authenticate } from './plugins/auth.js';
import { makeEdoAdapter, type ModuleAdapter } from './modules/registry.js';
import { RealtimeHub } from './services/realtime.js';
import { createWidgets, type FetchLike, type Widgets } from './services/widgets.js';
import { createMemoryStore } from './store/memory.js';
import type { Store } from './store/store.js';
import { authRoutes } from './routes/auth.js';
import { catalogRoutes } from './routes/catalog.js';
import { notificationRoutes } from './routes/notifications.js';
import { realtimeRoutes } from './routes/realtime.js';
import { settingsRoutes } from './routes/settings.js';
import { taskRoutes } from './routes/tasks.js';

export interface Deps {
  config: Config;
  store: Store;
  hub: RealtimeHub;
  widgets: Widgets;
  adapters: ModuleAdapter[];
  now: () => Date;
}

export interface AppOptions {
  config?: Config;
  store?: Store;
  fetch?: FetchLike;
  adapters?: ModuleAdapter[];
  now?: () => Date;
  logger?: boolean;
}

export async function buildApp(opts: AppOptions = {}) {
  const config = opts.config ?? loadConfig({ NODE_ENV: 'test', BCRYPT_ROUNDS: '4' });
  const now = opts.now ?? (() => new Date());
  const deps: Deps = {
    config,
    store: opts.store ?? createMemoryStore({ bcryptRounds: config.BCRYPT_ROUNDS }),
    hub: new RealtimeHub(),
    widgets: createWidgets(opts.fetch ?? ((url, init) => fetch(url, init)), now),
    adapters: opts.adapters ?? [makeEdoAdapter(now)],
    now,
  };

  const app = Fastify({ logger: opts.logger ?? false, bodyLimit: 1_048_576 });
  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler((_req, reply) =>
    reply.code(404).send({ error: 'not_found', message: 'Topilmadi' }),
  );

  await app.register(cors, {
    origin: config.CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });
  await app.register(rateLimit, { max: config.RATE_LIMIT_MAX, timeWindow: '1 minute' });
  await app.register(jwt, { secret: config.JWT_SECRET });
  await app.register(websocket, { options: { maxPayload: 64 * 1024 } });
  app.decorate('authenticate', authenticate);

  app.get('/health', async () => ({
    status: 'ok',
    store: deps.store.kind,
    uptimeSec: Math.round(process.uptime()),
    connections: deps.hub.size,
  }));

  authRoutes(app, deps);
  taskRoutes(app, deps);
  notificationRoutes(app, deps);
  settingsRoutes(app, deps);
  catalogRoutes(app, deps);
  await app.register(async (scope) => realtimeRoutes(scope, deps));

  app.addHook('onClose', () => deps.store.close());
  return app;
}

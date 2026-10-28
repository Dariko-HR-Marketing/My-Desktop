import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({ logger: false });
  app.get('/health', async () => 'ok');
  return app;
}

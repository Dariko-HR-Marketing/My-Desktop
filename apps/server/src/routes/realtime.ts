import type { FastifyInstance } from 'fastify';
import type { ServerMessage } from '@ish-maydoni/shared';
import type { Deps } from '../app.js';

const PING_MS = 25_000;

export function realtimeRoutes(app: FastifyInstance, { hub }: Deps) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const token = (req.query as { token?: string }).token;
    let userId: string;
    try {
      userId = app.jwt.verify<{ sub: string }>(token ?? '').sub;
    } catch {
      socket.close(4401, 'unauthorized');
      return;
    }
    const remove = hub.add(userId, socket);
    const hello: ServerMessage = { type: 'hello', payload: { userId } };
    socket.send(JSON.stringify(hello));
    const ping = setInterval(() => socket.ping(), PING_MS);
    socket.on('close', () => {
      clearInterval(ping);
      remove();
    });
  });
}

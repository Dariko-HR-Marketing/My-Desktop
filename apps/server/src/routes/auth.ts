import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import type { User } from '@ish-maydoni/shared';
import type { UserRecord } from '../domain/types.js';
import type { Deps } from '../app.js';

export const toPublicUser = (u: UserRecord): User => ({
  id: u.id,
  login: u.login,
  fullName: u.fullName,
  position: u.position,
  department: u.department,
  role: u.role,
});

const loginBody = z.object({
  login: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export function authRoutes(app: FastifyInstance, { store, config }: Deps) {
  // Compared when the login is unknown so response time doesn't reveal which logins exist.
  const dummyHash = bcrypt.hashSync('not-a-real-password', config.BCRYPT_ROUNDS);

  app.post(
    '/api/auth/login',
    { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } },
    async (req, reply) => {
      const { login, password } = loginBody.parse(req.body);
      const user = await store.users.findByLogin(login);
      const ok = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);
      if (!user || !ok) {
        return reply
          .code(401)
          .send({ error: 'invalid_credentials', message: 'Login yoki parol notoʻgʻri' });
      }
      const token = app.jwt.sign(
        { sub: user.id, role: user.role },
        { expiresIn: config.JWT_EXPIRES_IN },
      );
      return { token, user: toPublicUser(user) };
    },
  );

  const notImplemented = async (
    _req: unknown,
    reply: { code(n: number): { send(b: unknown): unknown } },
  ) => reply.code(501).send({ error: 'not_implemented', message: 'Tez orada' });
  app.post('/api/auth/oneid', notImplemented);
  app.post('/api/auth/eimzo', notImplemented);

  app.get('/api/me', { preHandler: app.authenticate }, async (req, reply) => {
    const user = await store.users.findById(req.user.sub);
    if (!user)
      return reply
        .code(401)
        .send({ error: 'unauthorized', message: 'Avtorizatsiya talab qilinadi' });
    return { user: toPublicUser(user), settings: await store.settings.get(user.id) };
  });
}

import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Role } from '@ish-maydoni/shared';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; role: Role };
    user: { sub: string; role: Role };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

export const JWT_EXPIRES_IN = '12h';

export async function authenticate(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await req.jwtVerify();
  } catch {
    await reply.code(401).send({ error: 'unauthorized', message: 'Avtorizatsiya talab qilinadi' });
  }
}

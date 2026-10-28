import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function httpError(statusCode: number, error: string, message: string) {
  return Object.assign(new Error(message), { statusCode, apiError: error });
}

const MESSAGES: Record<number, [string, string]> = {
  400: ['validation', 'Kiritilgan maʼlumot notoʻgʻri'],
  401: ['unauthorized', 'Avtorizatsiya talab qilinadi'],
  403: ['forbidden', 'Ruxsat yoʻq'],
  404: ['not_found', 'Topilmadi'],
  413: ['validation', 'Soʻrov hajmi juda katta'],
  429: ['rate_limited', 'Juda koʻp urinish. Birozdan soʻng qayta urining'],
};

export function errorHandler(err: FastifyError, req: FastifyRequest, reply: FastifyReply) {
  if (err instanceof ZodError) {
    return reply.code(400).send({
      error: 'validation',
      message: MESSAGES[400]![1],
      issues: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  const status = err.statusCode ?? 500;
  const explicit = (err as { apiError?: string }).apiError;
  // deliberate 5xx answers (e.g. 503 "source unavailable") keep their code and message; anything else is a bug
  if (status >= 500 && !explicit) {
    req.log.error(err);
    return reply.code(500).send({ error: 'internal', message: 'Server xatosi' });
  }
  const custom = (err as { apiError?: string }).apiError;
  const [code, fallback] = MESSAGES[status] ?? ['bad_request', 'Notoʻgʻri soʻrov'];
  const own = custom ? err.message : status === 429 ? fallback : fallback;
  return reply.code(status).send({ error: custom ?? code, message: own });
}

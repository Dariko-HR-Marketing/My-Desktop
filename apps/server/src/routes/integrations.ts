import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  INTEGRATION_PROVIDERS,
  providerByKey,
  type AiCompleteResponse,
  type IntegrationProvider,
  type IntegrationStatus,
  type IntegrationTestResult,
} from '@ish-maydoni/shared';
import { httpError } from '../errors.js';
import { completeWith } from '../services/ai.js';
import { canManage } from '../services/integrations.js';
import type { Deps } from '../app.js';

const saveBody = z.object({ fields: z.record(z.string().max(60), z.string().max(2000)) }).strict();

const aiBody = z
  .object({
    provider: z.string().max(40).optional(),
    model: z.string().trim().max(100).optional(),
    system: z.string().max(20_000).optional(),
    maxTokens: z.number().int().min(1).max(4000).optional(),
    messages: z
      .array(
        z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(20_000) }),
      )
      .min(1)
      .max(40),
  })
  .strict();

export function integrationRoutes(app: FastifyInstance, { integrations, http }: Deps) {
  const auth = { preHandler: app.authenticate };

  const provider = (key: string): IntegrationProvider => {
    const p = providerByKey(key);
    if (!p) throw httpError(404, 'not_found', 'Bunday xizmat katalogda yoʻq');
    return p;
  };
  const guard = (p: IntegrationProvider, role: Parameters<typeof canManage>[1]) => {
    if (!canManage(p, role))
      throw httpError(403, 'forbidden', 'Bu ulanishni faqat administrator boshqaradi');
  };

  app.get('/api/integrations/providers', auth, () => ({
    enabled: integrations.enabled,
    items: INTEGRATION_PROVIDERS,
  }));

  // Everyone sees whether a service is connected; only people who manage it see the (masked) field values.
  app.get(
    '/api/integrations',
    auth,
    async (req): Promise<{ enabled: boolean; items: IntegrationStatus[] }> => {
      const items = await Promise.all(
        INTEGRATION_PROVIDERS.map((p) =>
          integrations.status(p, req.user.sub, canManage(p, req.user.role)),
        ),
      );
      return { enabled: integrations.enabled, items };
    },
  );

  app.put<{ Params: { key: string } }>(
    '/api/integrations/:key',
    auth,
    async (req): Promise<IntegrationStatus> => {
      const p = provider(req.params.key);
      guard(p, req.user.role);
      await integrations.save(p, req.user.sub, saveBody.parse(req.body).fields);
      req.log.info({ integration: p.key, by: req.user.sub }, 'integration saved');
      return integrations.status(p, req.user.sub, true);
    },
  );

  app.delete<{ Params: { key: string } }>('/api/integrations/:key', auth, async (req, reply) => {
    const p = provider(req.params.key);
    guard(p, req.user.role);
    await integrations.remove(p, req.user.sub);
    req.log.info({ integration: p.key, by: req.user.sub }, 'integration removed');
    return reply.code(204).send();
  });

  app.post<{ Params: { key: string } }>(
    '/api/integrations/:key/test',
    { ...auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req): Promise<IntegrationTestResult> => {
      const p = provider(req.params.key);
      guard(p, req.user.role);
      const result = await integrations.test(p, req.user.sub);
      return { ...result, status: await integrations.status(p, req.user.sub, true) };
    },
  );

  // One entry point for every connected AI model, whatever its vendor.
  app.get('/api/ai/providers', auth, async (req) => {
    const ai = INTEGRATION_PROVIDERS.filter((p) => p.ai);
    const connected = await Promise.all(
      ai.map(async (p) => ((await integrations.credentials(p.key, req.user.sub)) ? p.key : null)),
    );
    return { items: ai.filter((_, i) => connected[i]).map((p) => ({ key: p.key, name: p.name })) };
  });

  app.post(
    '/api/ai/complete',
    { ...auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } },
    async (req): Promise<AiCompleteResponse> => {
      const body = aiBody.parse(req.body);
      const candidates = body.provider
        ? [provider(body.provider)]
        : INTEGRATION_PROVIDERS.filter((p) => p.ai);
      for (const p of candidates) {
        if (!p.ai) throw httpError(400, 'validation', 'Bu xizmat sunʼiy intellekt emas');
        const fields = await integrations.credentials(p.key, req.user.sub);
        if (!fields) continue;
        return completeWith(http, p, fields, body);
      }
      throw httpError(
        404,
        'ai_not_connected',
        'Sunʼiy intellekt ulanmagan. Administrator Sozlamalar → Integratsiyalar boʻlimida kalit kiritsin',
      );
    },
  );
}

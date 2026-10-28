import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { DENSITIES, FONT_SIZES, LANGUAGES, THEMES } from '@ish-maydoni/shared';
import { assertSafeUrl, UnsafeUrlError } from '../services/ssrf.js';
import type { Deps } from '../app.js';

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'HH:MM');

const patchBody = z
  .object({
    theme: z.enum(THEMES),
    density: z.enum(DENSITIES),
    language: z.enum(LANGUAGES),
    pinnedApps: z.array(z.string().max(50)).max(50),
    navCollapsed: z.boolean(),
    fontSize: z.enum(FONT_SIZES),
    quietEnabled: z.boolean(),
    quietFrom: hhmm,
    quietTo: hhmm,
    sleepMinutes: z.number().int().min(0).max(240),
    calendarUrl: z
      .string()
      .trim()
      .max(500)
      .superRefine((v, ctx) => {
        if (v === '') return;
        try {
          assertSafeUrl(v);
        } catch (e) {
          ctx.addIssue({
            code: 'custom',
            message: e instanceof UnsafeUrlError ? e.message : 'Manzil notoʻgʻri',
          });
        }
      }),
  })
  .partial()
  .strict();

export function settingsRoutes(app: FastifyInstance, { store, hub }: Deps) {
  const auth = { preHandler: app.authenticate };

  app.get('/api/settings', auth, (req) => store.settings.get(req.user.sub));

  app.patch('/api/settings', auth, async (req) => {
    const settings = await store.settings.update(req.user.sub, patchBody.parse(req.body));
    hub.publish(req.user.sub, { type: 'settings.changed', payload: settings });
    return settings;
  });
}

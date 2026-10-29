import { createHmac } from 'node:crypto';
import type { HttpClient } from './ssrf.js';
import type { IntegrationService } from './integrations.js';

export interface WebhookEmitter {
  /** Sends `{event, at, data}` to the connected webhook, if any. Never throws and never delays the caller. */
  emit(event: string, data: unknown): void;
}

export const signBody = (secret: string, body: string) =>
  `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

export function createWebhookEmitter(opts: {
  integrations: IntegrationService;
  http: HttpClient;
  now: () => Date;
  onError?: (err: unknown) => void;
}): WebhookEmitter {
  return {
    emit(event, data) {
      void (async () => {
        const fields = await opts.integrations.credentials('webhook', 'org');
        if (!fields?.url) return;
        const body = JSON.stringify({ event, at: opts.now().toISOString(), data });
        const headers: Record<string, string> = {
          'content-type': 'application/json',
          'x-ish-event': event,
        };
        if (fields.secret) headers['x-ish-signature'] = signBody(fields.secret, body);
        const res = await opts.http({
          method: 'POST',
          url: fields.url,
          headers,
          body,
          timeoutMs: 5000,
        });
        if (res.status >= 400) throw new Error(`webhook answered ${res.status}`);
      })().catch((e) => opts.onError?.(e));
    },
  };
}

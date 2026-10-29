import { describe, expect, it } from 'vitest';
import { providerByKey } from '@ish-maydoni/shared';
import { loadConfig } from '../src/config.js';
import { signRequest } from '../src/services/integrations.js';
import type { HttpRequest, HttpResult } from '../src/services/ssrf.js';
import { createMemoryStore } from '../src/store/memory.js';
import { createVault } from '../src/services/vault.js';
import { signBody } from '../src/services/webhook.js';
import { login, makeApp } from './helpers.js';

const KEY = 'sk-live-ABCDEFGH12345678';

function fakeHttp(reply: (req: HttpRequest) => HttpResult | Promise<HttpResult>) {
  const calls: HttpRequest[] = [];
  return {
    calls,
    http: async (req: HttpRequest) => {
      calls.push(req);
      return reply(req);
    },
  };
}
const ok = (data: unknown = {}, status = 200): HttpResult => ({
  status,
  text: JSON.stringify(data),
});

describe('vault', () => {
  const key = Buffer.alloc(32, 7).toString('base64');
  it('round-trips and uses a fresh nonce each time', () => {
    const v = createVault(key);
    const a = v.encrypt({ apiKey: KEY });
    expect(a).not.toContain(KEY);
    expect(v.decrypt(a)).toEqual({ apiKey: KEY });
    expect(v.encrypt({ apiKey: KEY })).not.toBe(a);
  });
  it('rejects tampered data and a different key', () => {
    const v = createVault(key);
    const blob = v.encrypt({ a: 'b' });
    const parts = blob.split('.');
    parts[3] = Buffer.from('x'.repeat(10)).toString('base64url');
    expect(() => v.decrypt(parts.join('.'))).toThrow();
    expect(() => createVault(Buffer.alloc(32, 9).toString('base64')).decrypt(blob)).toThrow();
  });
  it('requires a 32-byte key', () => {
    expect(() => createVault(Buffer.alloc(16).toString('base64'))).toThrow(/32 bytes/);
  });
});

describe('signRequest', () => {
  it('fills placeholders and attaches credentials per provider kind', () => {
    const rest = signRequest(
      providerByKey('rest')!,
      { baseUrl: 'https://a.uz/v1', header: 'X-Api-Key', apiKey: 'k1', testPath: '/h' },
      {
        method: 'GET',
        url: '{baseUrl}{testPath}',
      },
    );
    expect(rest.url).toBe('https://a.uz/v1/h');
    expect(rest.headers!['x-api-key']).toBe('k1');
    const anthropic = signRequest(
      providerByKey('anthropic')!,
      { apiKey: 'k2' },
      { method: 'GET', url: 'https://x.test/y' },
    );
    expect(anthropic.headers!['x-api-key']).toBe('k2');
    expect(anthropic.headers!['anthropic-version']).toBeTruthy();
    const bearer = signRequest(
      providerByKey('openai')!,
      { apiKey: 'k3' },
      { method: 'POST', url: 'https://x.test/y', body: '{}' },
    );
    expect(bearer.headers!.authorization).toBe('Bearer k3');
    expect(bearer.headers!['content-type']).toBe('application/json');
  });
});

describe('integrations API', () => {
  it('needs a login and lists the catalog', async () => {
    const app = await makeApp();
    expect((await app.inject({ url: '/api/integrations' })).statusCode).toBe(401);
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/integrations/providers', headers });
    const body = res.json();
    expect(body.enabled).toBe(true);
    expect(body.items.map((p: any) => p.key)).toEqual(
      expect.arrayContaining(['anthropic', 'openai', 'gemini', 'telegram-bot', 'rest']),
    );
  });

  it('only administrators manage organisation-wide services; employees can manage their own', async () => {
    const app = await makeApp();
    const emp = await login(app, 'xodim');
    const admin = await login(app, 'admin');
    const put = (headers: any, key: string) =>
      app.inject({
        method: 'PUT',
        url: `/api/integrations/${key}`,
        headers,
        payload: { fields: { apiKey: KEY, token: KEY } },
      });
    expect((await put(emp.headers, 'openai')).statusCode).toBe(403);
    expect((await put(admin.headers, 'openai')).statusCode).toBe(200);
    expect((await put(emp.headers, 'github')).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: 'DELETE',
          url: '/api/integrations/openai',
          headers: emp.headers,
        })
      ).statusCode,
    ).toBe(403);
    expect((await put(admin.headers, 'nope')).statusCode).toBe(404);
  });

  it('never returns or stores the secret in clear text', async () => {
    const app = await makeApp();
    const admin = await login(app, 'admin');
    const emp = await login(app, 'xodim');
    const saved = await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers: admin.headers,
      payload: { fields: { apiKey: KEY } },
    });
    expect(saved.body).not.toContain(KEY);
    expect(saved.json().fields).toEqual([{ key: 'apiKey', set: true, hint: '••••5678' }]);
    const list = (h: any) => app.inject({ url: '/api/integrations', headers: h });
    const adminView = await list(admin.headers);
    expect(adminView.body).not.toContain(KEY);
    expect(adminView.json().items.find((i: any) => i.key === 'openai').connected).toBe(true);
    // employees see that it is connected, but none of the field details
    const empOpenai = (await list(emp.headers)).json().items.find((i: any) => i.key === 'openai');
    expect(empOpenai.connected).toBe(true);
    expect(empOpenai.fields).toEqual([]);
  });

  it('encrypts at rest', async () => {
    const store = createMemoryStore({ bcryptRounds: 4 });
    const app = await makeApp({ store });
    const admin = await login(app, 'admin');
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers: admin.headers,
      payload: { fields: { apiKey: KEY } },
    });
    const row = await store.integrations.get('org', 'openai');
    expect(row).not.toBeNull();
    expect(row!.dataEnc).not.toContain(KEY);
    expect(row!.dataEnc.startsWith('v1.')).toBe(true);
  });

  it('validates required fields and unsafe addresses', async () => {
    const app = await makeApp();
    const { headers } = await login(app, 'admin');
    const put = (key: string, fields: Record<string, string>) =>
      app.inject({ method: 'PUT', url: `/api/integrations/${key}`, headers, payload: { fields } });
    expect((await put('openai', {})).statusCode).toBe(400);
    expect((await put('edo', { baseUrl: 'http://edo.uz/api', apiKey: 'k' })).statusCode).toBe(400);
    expect((await put('edo', { baseUrl: 'https://localhost/api', apiKey: 'k' })).statusCode).toBe(
      400,
    );
    expect((await put('edo', { baseUrl: 'https://10.0.0.1/api', apiKey: 'k' })).statusCode).toBe(
      400,
    );
    expect((await put('edo', { baseUrl: 'https://edo.uz/api/', apiKey: 'k' })).statusCode).toBe(
      200,
    );
    const st = (await app.inject({ url: '/api/integrations', headers }))
      .json()
      .items.find((i: any) => i.key === 'edo');
    expect(st.fields.find((f: any) => f.key === 'baseUrl').hint).toBe('https://edo.uz/api'); // trailing slash trimmed, non-secret shown
  });

  it('keeps the stored secret when it is left empty on edit', async () => {
    const f = fakeHttp(() => ok());
    const app = await makeApp({ http: f.http });
    const { headers } = await login(app, 'admin');
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: '' } },
    });
    await app.inject({ method: 'POST', url: '/api/integrations/openai/test', headers });
    expect(f.calls[0]!.headers!.authorization).toBe(`Bearer ${KEY}`);
  });

  it('tests a connection and reports problems without leaking the key', async () => {
    let next: HttpResult = ok();
    const f = fakeHttp(() => next);
    const app = await makeApp({ http: f.http });
    const { headers } = await login(app, 'admin');
    const test = (key: string) =>
      app.inject({ method: 'POST', url: `/api/integrations/${key}/test`, headers });

    expect((await test('openai')).json().ok).toBe(false); // nothing saved yet

    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    const good = (await test('openai')).json();
    expect(good.ok).toBe(true);
    expect(good.status.lastTest.ok).toBe(true);
    expect(f.calls.at(-1)!.url).toBe('https://api.openai.com/v1/models');

    next = { status: 401, text: `bad key ${KEY}` };
    const bad = await test('openai');
    expect(bad.json().ok).toBe(false);
    expect(bad.body).not.toContain(KEY);

    await app.inject({
      method: 'PUT',
      url: '/api/integrations/telegram-bot',
      headers,
      payload: { fields: { token: '123:abc' } },
    });
    next = ok({ ok: false });
    expect((await test('telegram-bot')).json().ok).toBe(false);
    next = ok({ ok: true });
    expect((await test('telegram-bot')).json().ok).toBe(true);
    expect(f.calls.at(-1)!.url).toBe('https://api.telegram.org/bot123:abc/getMe');

    next = ok();
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/anthropic',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    await test('anthropic');
    expect(f.calls.at(-1)!.headers!['x-api-key']).toBe(KEY);
  });

  it('reports an unreachable service politely', async () => {
    const app = await makeApp({
      http: async () => {
        throw new Error('ECONNREFUSED 10.1.2.3');
      },
    });
    const { headers } = await login(app, 'admin');
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    const r = (
      await app.inject({ method: 'POST', url: '/api/integrations/openai/test', headers })
    ).json();
    expect(r.ok).toBe(false);
    expect(r.message).not.toContain('10.1.2.3');
  });

  it('disconnects', async () => {
    const app = await makeApp();
    const { headers } = await login(app, 'admin');
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    expect(
      (await app.inject({ method: 'DELETE', url: '/api/integrations/openai', headers })).statusCode,
    ).toBe(204);
    const st = (await app.inject({ url: '/api/integrations', headers }))
      .json()
      .items.find((i: any) => i.key === 'openai');
    expect(st.connected).toBe(false);
  });

  it('answers 503 when the server has no INTEGRATIONS_KEY', async () => {
    const config = {
      ...loadConfig({ NODE_ENV: 'test', BCRYPT_ROUNDS: '4' }),
      INTEGRATIONS_KEY: undefined,
    };
    const app = await makeApp({ config });
    const { headers } = await login(app, 'admin');
    expect((await app.inject({ url: '/api/integrations/providers', headers })).json().enabled).toBe(
      false,
    );
    const put = await app.inject({
      method: 'PUT',
      url: '/api/integrations/openai',
      headers,
      payload: { fields: { apiKey: KEY } },
    });
    expect(put.statusCode).toBe(503);
    expect(put.json().error).toBe('integrations_disabled');
  });
});

describe('AI gateway', () => {
  async function connected(
    reply: (r: HttpRequest) => HttpResult,
    keys: Record<string, Record<string, string>>,
  ) {
    const f = fakeHttp(reply);
    const app = await makeApp({ http: f.http });
    const admin = await login(app, 'admin');
    for (const [k, fields] of Object.entries(keys)) {
      const r = await app.inject({
        method: 'PUT',
        url: `/api/integrations/${k}`,
        headers: admin.headers,
        payload: { fields },
      });
      expect(r.statusCode).toBe(200);
    }
    return { app, f, emp: await login(app, 'xodim') };
  }
  const ask = (app: any, headers: any, payload: object) =>
    app.inject({ method: 'POST', url: '/api/ai/complete', headers, payload });
  const messages = [{ role: 'user', content: 'Salom' }];

  it('says so when no AI is connected', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const r = await ask(app, headers, { messages });
    expect(r.statusCode).toBe(404);
    expect(r.json().error).toBe('ai_not_connected');
    expect((await app.inject({ url: '/api/ai/providers', headers })).json().items).toEqual([]);
  });

  it('talks to OpenAI-style providers', async () => {
    const { app, f, emp } = await connected(
      () => ok({ choices: [{ message: { content: 'Assalomu alaykum' } }] }),
      { openai: { apiKey: KEY } },
    );
    const r = await ask(app, emp.headers, { messages, system: 'Qisqa javob ber', maxTokens: 50 });
    expect(r.json()).toEqual({
      provider: 'openai',
      model: 'gpt-4o-mini',
      text: 'Assalomu alaykum',
    });
    const sent = f.calls[0]!;
    expect(sent.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(sent.headers!.authorization).toBe(`Bearer ${KEY}`);
    expect(JSON.parse(sent.body!)).toMatchObject({
      max_tokens: 50,
      messages: [
        { role: 'system', content: 'Qisqa javob ber' },
        { role: 'user', content: 'Salom' },
      ],
    });
    expect(
      (await app.inject({ url: '/api/ai/providers', headers: emp.headers })).json().items,
    ).toEqual([{ key: 'openai', name: 'OpenAI (GPT)' }]);
  });

  it('talks to Anthropic', async () => {
    const { app, f, emp } = await connected(
      () => ok({ content: [{ type: 'text', text: 'Salom!' }] }),
      { anthropic: { apiKey: KEY } },
    );
    const r = await ask(app, emp.headers, { provider: 'anthropic', messages, system: 'S' });
    expect(r.json().text).toBe('Salom!');
    const sent = f.calls[0]!;
    expect(sent.url).toBe('https://api.anthropic.com/v1/messages');
    expect(sent.headers!['x-api-key']).toBe(KEY);
    expect(JSON.parse(sent.body!)).toMatchObject({ system: 'S', messages, max_tokens: 1024 });
  });

  it('talks to Gemini', async () => {
    const { app, f, emp } = await connected(
      () => ok({ candidates: [{ content: { parts: [{ text: 'Ha' }] } }] }),
      { gemini: { apiKey: KEY } },
    );
    const r = await ask(app, emp.headers, {
      messages: [
        ...messages,
        { role: 'assistant', content: 'Xo‘sh' },
        { role: 'user', content: 'Yana' },
      ],
    });
    expect(r.json().text).toBe('Ha');
    const body = JSON.parse(f.calls[0]!.body!);
    expect(f.calls[0]!.url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    );
    expect(body.contents.map((c: any) => c.role)).toEqual(['user', 'model', 'user']);
    expect(f.calls[0]!.headers!['x-goog-api-key']).toBe(KEY);
  });

  it('uses the administrator’s own OpenAI-compatible server', async () => {
    const { app, f, emp } = await connected(
      () => ok({ choices: [{ message: { content: 'ok' } }] }),
      {
        'openai-compatible': { baseUrl: 'https://llm.kompaniya.uz/v1', model: 'llama3.1' },
      },
    );
    const r = await ask(app, emp.headers, { messages });
    expect(r.json()).toMatchObject({ provider: 'openai-compatible', model: 'llama3.1' });
    expect(f.calls[0]!.url).toBe('https://llm.kompaniya.uz/v1/chat/completions');
    expect(f.calls[0]!.headers!.authorization).toBeUndefined(); // no key set
  });

  it('maps provider failures to clear errors', async () => {
    let status = 401;
    const { app, emp } = await connected(() => ({ status, text: `{"error":"${KEY}"}` }), {
      openai: { apiKey: KEY },
    });
    for (const [s, code, http] of [
      [401, 'ai_rejected', 502],
      [429, 'ai_busy', 503],
      [500, 'ai_error', 502],
    ] as const) {
      status = s;
      const r = await ask(app, emp.headers, { messages });
      expect([r.statusCode, r.json().error]).toEqual([http, code]);
      expect(r.body).not.toContain(KEY);
    }
  });

  it('validates the request', async () => {
    const { app, emp } = await connected(() => ok(), { openai: { apiKey: KEY } });
    expect((await ask(app, emp.headers, { messages: [] })).statusCode).toBe(400);
    expect((await ask(app, emp.headers, { messages, maxTokens: 999999 })).statusCode).toBe(400);
    expect((await ask(app, emp.headers, { messages, provider: 'telegram-bot' })).statusCode).toBe(
      400,
    );
    expect((await ask(app, emp.headers, { messages, extra: 1 })).statusCode).toBe(400);
  });
});

describe('outgoing webhook', () => {
  const settle = () => new Promise((r) => setTimeout(r, 30));

  it('signs and delivers a notification event only when a webhook is connected', async () => {
    const f = fakeHttp(() => ok());
    const app = await makeApp({ http: f.http });
    const rahbar = await login(app, 'rahbar');
    const admin = await login(app, 'admin');
    const xodim = await login(app, 'xodim');
    const send = () =>
      app.inject({
        method: 'POST',
        url: '/api/notifications',
        headers: rahbar.headers,
        payload: { userId: xodim.userId, category: 'WORK', title: 'Hisobot' },
      });

    expect((await send()).statusCode).toBe(201);
    await settle();
    expect(f.calls).toHaveLength(0); // nothing connected, nothing sent

    await app.inject({
      method: 'PUT',
      url: '/api/integrations/webhook',
      headers: admin.headers,
      payload: { fields: { url: 'https://hooks.kompaniya.uz/ish', secret: 'shh' } },
    });
    expect((await send()).statusCode).toBe(201);
    await settle();

    expect(f.calls).toHaveLength(1);
    const call = f.calls[0]!;
    expect(call.url).toBe('https://hooks.kompaniya.uz/ish');
    expect(call.headers!['x-ish-event']).toBe('notification.created');
    expect(call.headers!['x-ish-signature']).toBe(signBody('shh', call.body!));
    expect(JSON.parse(call.body!)).toMatchObject({
      event: 'notification.created',
      data: { userId: xodim.userId },
    });
  });

  it('a failing webhook never breaks the request', async () => {
    const f = fakeHttp(() => {
      throw new Error('down');
    });
    const app = await makeApp({ http: f.http });
    const admin = await login(app, 'admin');
    const xodim = await login(app, 'xodim');
    await app.inject({
      method: 'PUT',
      url: '/api/integrations/webhook',
      headers: admin.headers,
      payload: { fields: { url: 'https://h.uz/x' } },
    });
    const r = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: admin.headers,
      payload: { userId: xodim.userId, category: 'WORK', title: 'X' },
    });
    expect(r.statusCode).toBe(201);
  });
});

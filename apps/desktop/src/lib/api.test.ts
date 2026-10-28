import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApi, NetworkError } from './api';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

function make(fetchFn: typeof fetch, token: string | null = 'tok') {
  const onUnauthorized = vi.fn();
  const api = createApi({
    baseUrl: () => 'http://x',
    getToken: () => token,
    onUnauthorized,
    fetchFn,
    timeoutMs: 50,
  });
  return { api, onUnauthorized };
}

describe('api', () => {
  it('sends the bearer token and JSON body', async () => {
    const fetchFn = vi.fn(async () => json({ ok: 1 }));
    const { api } = make(fetchFn as never);
    await api.post('/api/tasks', { title: 'a' });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://x/api/tasks');
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer tok');
    expect(init.body).toBe('{"title":"a"}');
  });

  it('maps error bodies to ApiError', async () => {
    const { api } = make((async () =>
      json(
        { error: 'validation', message: 'Noto‘g‘ri', issues: [{ path: 'title', message: 'x' }] },
        400,
      )) as never);
    const err = await api.post('/x', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 400, code: 'validation', issues: [{ path: 'title' }] });
  });

  it('signs out on 401 for authenticated requests only', async () => {
    const { api, onUnauthorized } = make((async () =>
      json({ error: 'unauthorized', message: 'x' }, 401)) as never);
    await api.get('/api/me').catch(() => {});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    await api.post('/api/auth/login', {}, { anonymous: true }).catch(() => {});
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not send the token on anonymous requests', async () => {
    const fetchFn = vi.fn(async () => json({}));
    const { api } = make(fetchFn as never);
    await api.post('/api/auth/login', {}, { anonymous: true });
    const init = (fetchFn.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it('throws NetworkError when the request fails or times out', async () => {
    const down = make((async () => Promise.reject(new TypeError('Failed to fetch'))) as never);
    await expect(down.api.get('/x')).rejects.toBeInstanceOf(NetworkError);
    const slow = make(
      ((_u: string, init: RequestInit) =>
        new Promise((_r, rej) =>
          init.signal?.addEventListener('abort', () => rej(new Error('aborted'))),
        )) as never,
    );
    await expect(slow.api.get('/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('returns undefined for 204', async () => {
    const { api } = make((async () => new Response(null, { status: 204 })) as never);
    await expect(api.delete('/api/tasks/1')).resolves.toBeUndefined();
  });
});

import { describe, expect, it } from 'vitest';
import { login, makeApp } from './helpers.js';

describe('auth', () => {
  it('health reports store kind', async () => {
    const app = await makeApp();
    const res = await app.inject({ url: '/health' });
    expect(res.json()).toMatchObject({ status: 'ok', store: 'memory', connections: 0 });
  });

  it('logs in with demo credentials', async () => {
    const app = await makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: 'xodim', password: 'demo12345' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toEqual(expect.any(String));
    expect(body.user).toMatchObject({ login: 'xodim', role: 'EMPLOYEE' });
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('gives the same 401 for a wrong password and an unknown login', async () => {
    const app = await makeApp();
    const bad = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: 'xodim', password: 'x' },
    });
    const unknown = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: 'nobody', password: 'x' },
    });
    expect(bad.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(bad.json()).toEqual(unknown.json());
    expect(bad.json()).toEqual({
      error: 'invalid_credentials',
      message: 'Login yoki parol notoʻgʻri',
    });
  });

  it('rate-limits login after 10 attempts per minute', async () => {
    const app = await makeApp();
    const codes: number[] = [];
    for (let i = 0; i < 11; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { login: 'xodim', password: 'bad' },
      });
      codes.push(res.statusCode);
    }
    expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
    expect(codes[10]).toBe(429);
  });

  it('rejects protected endpoints without or with a bad token', async () => {
    const app = await makeApp();
    expect((await app.inject({ url: '/api/me' })).statusCode).toBe(401);
    const bad = await app.inject({ url: '/api/tasks', headers: { authorization: 'Bearer nope' } });
    expect(bad.statusCode).toBe(401);
    expect(bad.json().error).toBe('unauthorized');
  });

  it('returns the current user with settings', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/me', headers });
    expect(res.json()).toMatchObject({
      user: { login: 'xodim' },
      settings: { theme: 'system', density: 'comfortable', language: 'uz-Latn' },
    });
  });

  it('answers 501 for OneID and E-IMZO', async () => {
    const app = await makeApp();
    expect((await app.inject({ method: 'POST', url: '/api/auth/oneid' })).statusCode).toBe(501);
    expect((await app.inject({ method: 'POST', url: '/api/auth/eimzo' })).statusCode).toBe(501);
  });

  it('returns the documented validation error shape', async () => {
    const app = await makeApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { login: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: 'validation', issues: expect.any(Array) });
  });
});

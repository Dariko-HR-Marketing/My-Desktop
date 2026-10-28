import { buildApp, type AppOptions } from '../src/app.js';

export async function makeApp(opts: AppOptions = {}) {
  const app = await buildApp(opts);
  await app.ready();
  return app;
}

type App = Awaited<ReturnType<typeof makeApp>>;

export async function login(app: App, who: 'xodim' | 'rahbar' | 'admin' = 'xodim') {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { login: who, password: 'demo12345' },
  });
  const body = res.json() as { token: string; user: { id: string } };
  return {
    token: body.token,
    userId: body.user.id,
    headers: { authorization: `Bearer ${body.token}` },
  };
}

export const jsonResponse = (data: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: async () => data });

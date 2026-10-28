import { describe, expect, it } from 'vitest';
import type WebSocket from 'ws';
import { login, makeApp } from './helpers.js';

function collector() {
  const messages: { type: string; payload: unknown }[] = [];
  // Attached via injectWS's onInit so the server's immediate `hello` isn't missed.
  const attach = (ws: WebSocket) =>
    void ws.on('message', (d) => messages.push(JSON.parse(String(d))));
  const waitFor = async (type: string, timeoutMs = 2000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const m = messages.find((x) => x.type === type);
      if (m) return m;
      await new Promise((r) => setTimeout(r, 10));
    }
    throw new Error(`timed out waiting for ${type}`);
  };
  return { attach, waitFor };
}

describe('notifications', () => {
  it('lists with unread count and marks read', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const list = (await app.inject({ url: '/api/notifications', headers })).json();
    expect(list.unread).toBe(3);
    const one = await app.inject({
      method: 'POST',
      url: '/api/notifications/read',
      headers,
      payload: { ids: [list.items[0].id] },
    });
    expect(one.json()).toEqual({ count: 1 });
    expect(
      (await app.inject({ url: '/api/notifications?unread=1', headers })).json().items,
    ).toHaveLength(2);
    const all = await app.inject({
      method: 'POST',
      url: '/api/notifications/read',
      headers,
      payload: { ids: 'all' },
    });
    expect(all.json()).toEqual({ count: 2 });
    expect((await app.inject({ url: '/api/notifications', headers })).json().unread).toBe(0);
  });

  it('forbids employees from sending notifications', async () => {
    const app = await makeApp();
    const emp = await login(app, 'xodim');
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: emp.headers,
      payload: { userId: emp.userId, category: 'WORK', title: 'x' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('delivers a manager notification to the employee over WebSocket', async () => {
    const app = await makeApp();
    const emp = await login(app, 'xodim');
    const mgr = await login(app, 'rahbar');
    const { attach, waitFor } = collector();
    const ws = await app.injectWS(`/ws?token=${emp.token}`, {}, { onInit: attach });
    await waitFor('hello');

    const sentAt = Date.now();
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: mgr.headers,
      payload: {
        userId: emp.userId,
        category: 'WORK',
        title: 'Shoshilinch topshiriq',
        actionLabel: 'Ochish',
      },
    });
    expect(res.statusCode).toBe(201);
    const msg = await waitFor('notification.created');
    expect(Date.now() - sentAt).toBeLessThan(2000);
    expect(msg.payload).toMatchObject({ title: 'Shoshilinch topshiriq', body: '', readAt: null });
    ws.terminate();
  });

  it('rejects a notification for an unknown user', async () => {
    const app = await makeApp();
    const mgr = await login(app, 'rahbar');
    const res = await app.inject({
      method: 'POST',
      url: '/api/notifications',
      headers: mgr.headers,
      payload: { userId: 'nope', category: 'WORK', title: 'x' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('closes the socket with 4401 on a bad token', async () => {
    const app = await makeApp();
    const ws = await app.injectWS('/ws?token=bad');
    const code = await new Promise<number>((resolve) => ws.on('close', (c) => resolve(c)));
    expect(code).toBe(4401);
  });

  it('pushes task and settings changes to the owner', async () => {
    const app = await makeApp();
    const emp = await login(app);
    const { attach, waitFor } = collector();
    const ws = await app.injectWS(`/ws?token=${emp.token}`, {}, { onInit: attach });
    await waitFor('hello');
    await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers: emp.headers,
      payload: { title: 'Yangi' },
    });
    await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      headers: emp.headers,
      payload: { theme: 'dark' },
    });
    expect((await waitFor('task.changed')).payload).toMatchObject({ title: 'Yangi' });
    expect((await waitFor('settings.changed')).payload).toMatchObject({ theme: 'dark' });
    ws.terminate();
  });
});

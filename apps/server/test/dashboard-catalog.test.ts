import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../src/store/memory.js';
import type { ModuleAdapter } from '../src/modules/registry.js';
import { login, makeApp } from './helpers.js';

describe('catalog and roles', () => {
  it('hides the manager module from employees', async () => {
    const app = await makeApp();
    const emp = await login(app, 'xodim');
    const mgr = await login(app, 'rahbar');
    const keys = async (h: typeof emp.headers) =>
      (await app.inject({ url: '/api/catalog/modules', headers: h }))
        .json()
        .items.map((m: { key: string }) => m.key);
    expect(await keys(emp.headers)).toEqual(['edo', 'hr']);
    expect(await keys(mgr.headers)).toContain('manager');
  });

  it('serves the app catalog ordered', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const { items } = (await app.inject({ url: '/api/catalog/apps', headers })).json();
    expect(items).toHaveLength(10);
    expect(items.map((a: { order: number }) => a.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

describe('dashboard', () => {
  const now = new Date('2026-10-28T07:00:00Z'); // 12:00 in Tashkent

  it('counts tasks and collects module signals', async () => {
    const app = await makeApp({
      now: () => now,
      store: createMemoryStore({ bcryptRounds: 4, now: () => now }),
    });
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/dashboard', headers });
    expect(res.json()).toMatchObject({
      tasks: { today: 2, todayDone: 0, open: 5, overdue: 1 },
      unreadNotifications: 3,
      generatedAt: now.toISOString(),
    });
    expect(res.json().signals.map((s: { label: string }) => s.label)).toEqual([
      'Imzo kutmoqda',
      'Muddati oʻtgan',
    ]);
  });

  it('updates counts when a task is completed', async () => {
    const app = await makeApp({
      now: () => now,
      store: createMemoryStore({ bcryptRounds: 4, now: () => now }),
    });
    const { headers } = await login(app);
    const { items } = (await app.inject({ url: '/api/tasks', headers })).json();
    const todayTask = items.find((t: { dueAt: string | null }) =>
      t.dueAt?.startsWith('2026-10-28T09'),
    );
    await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${todayTask.id}`,
      headers,
      payload: { status: 'DONE' },
    });
    expect((await app.inject({ url: '/api/dashboard', headers })).json().tasks).toMatchObject({
      today: 2,
      todayDone: 1,
      open: 4,
    });
  });

  it('keeps other modules visible when one adapter fails', async () => {
    const broken: ModuleAdapter = {
      key: 'hr',
      signals: async () => {
        throw new Error('boom');
      },
    };
    const ok: ModuleAdapter = {
      key: 'edo',
      signals: async () => [
        {
          moduleKey: 'edo',
          label: 'Imzo kutmoqda',
          count: 1,
          tone: 'info',
          url: 'module://edo/documents',
        },
      ],
    };
    const app = await makeApp({ adapters: [broken, ok] });
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/dashboard', headers });
    expect(res.statusCode).toBe(200);
    expect(res.json().signals).toHaveLength(1);
  });

  it("omits signals of modules the role can't access", async () => {
    const managerOnly: ModuleAdapter = {
      key: 'manager',
      signals: async () => [
        { moduleKey: 'manager', label: 'X', count: 1, tone: 'info', url: 'module://manager' },
      ],
    };
    const app = await makeApp({ adapters: [managerOnly] });
    const emp = await login(app, 'xodim');
    const mgr = await login(app, 'rahbar');
    expect(
      (await app.inject({ url: '/api/dashboard', headers: emp.headers })).json().signals,
    ).toEqual([]);
    expect(
      (await app.inject({ url: '/api/dashboard', headers: mgr.headers })).json().signals,
    ).toHaveLength(1);
  });
});

describe('settings', () => {
  it('updates partially and validates', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      headers,
      payload: { theme: 'dark', navCollapsed: true },
    });
    expect(res.json()).toMatchObject({ theme: 'dark', navCollapsed: true, density: 'comfortable' });
    expect((await app.inject({ url: '/api/settings', headers })).json().theme).toBe('dark');
    expect(
      (
        await app.inject({
          method: 'PATCH',
          url: '/api/settings',
          headers,
          payload: { theme: 'neon' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'PATCH', url: '/api/settings', headers, payload: { hacker: 1 } }))
        .statusCode,
    ).toBe(400);
  });
});

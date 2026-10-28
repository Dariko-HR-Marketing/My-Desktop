import { describe, expect, it } from 'vitest';
import type { EdoData } from '@ish-maydoni/shared';
import type { ModuleAdapter } from '../src/modules/registry.js';
import { login, makeApp } from './helpers.js';

describe('module data', () => {
  it('serves the EDO demo data with consistent counters', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const res = await app.inject({ url: '/api/modules/edo/data', headers });
    expect(res.statusCode).toBe(200);
    const data = res.json() as EdoData;
    expect(data.documents.length).toBeGreaterThan(5);
    expect(data.assignments.map((a) => a.column)).toEqual(
      expect.arrayContaining(['NEW', 'IN_PROGRESS', 'REVIEW', 'DONE']),
    );
    expect(data.control.counters.overdue).toBe(
      data.control.rows.filter((r) => r.status === 'OVERDUE').length,
    );

    // the dashboard signals come from the same data
    const signals = (await app.inject({ url: '/api/dashboard', headers })).json().signals as {
      label: string;
      count: number;
    }[];
    expect(signals.find((s) => s.label === 'Imzo kutmoqda')!.count).toBe(
      data.documents.filter((d) => d.status === 'SIGN').length,
    );
    expect(signals.find((s) => s.label === 'Muddati oʻtgan')!.count).toBe(
      data.control.counters.overdue,
    );
  });

  it('is relative to the current time', async () => {
    const now = new Date('2026-10-28T07:00:00Z');
    const app = await makeApp({ now: () => now });
    const { headers } = await login(app);
    const data = (await app.inject({ url: '/api/modules/edo/data', headers })).json() as EdoData;
    const overdue = data.control.rows.filter((r) => r.status === 'OVERDUE');
    expect(overdue.every((r) => new Date(r.due) < now)).toBe(true);
    expect(
      data.control.rows.filter((r) => r.status === 'TODAY').every((r) => new Date(r.due) > now),
    ).toBe(true);
  });

  it('requires authentication', async () => {
    const app = await makeApp();
    expect((await app.inject({ url: '/api/modules/edo/data' })).statusCode).toBe(401);
  });

  it('404 for unknown modules and modules without data', async () => {
    const app = await makeApp();
    const { headers } = await login(app, 'rahbar');
    expect((await app.inject({ url: '/api/modules/ghost/data', headers })).statusCode).toBe(404);
    expect((await app.inject({ url: '/api/modules/hr/data', headers })).statusCode).toBe(404);
  });

  it('403 when the role is not allowed to use the module', async () => {
    const managerOnly: ModuleAdapter = {
      key: 'manager',
      signals: async () => [],
      data: async () => ({ secret: 1 }),
    };
    const app = await makeApp({ adapters: [managerOnly] });
    const emp = await login(app, 'xodim');
    const mgr = await login(app, 'rahbar');
    const denied = await app.inject({ url: '/api/modules/manager/data', headers: emp.headers });
    expect(denied.statusCode).toBe(403);
    expect(denied.json().error).toBe('forbidden');
    expect(
      (await app.inject({ url: '/api/modules/manager/data', headers: mgr.headers })).json(),
    ).toEqual({ secret: 1 });
  });
});

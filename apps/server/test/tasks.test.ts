import { describe, expect, it } from 'vitest';
import { login, makeApp } from './helpers.js';

describe('tasks', () => {
  it('creates, updates and deletes a task', async () => {
    const app = await makeApp();
    const { headers } = await login(app);

    const created = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: 'Hisobot', priority: 'HIGH' },
    });
    expect(created.statusCode).toBe(201);
    const task = created.json();
    expect(task).toMatchObject({
      title: 'Hisobot',
      status: 'TODO',
      priority: 'HIGH',
      source: 'PERSONAL',
      completedAt: null,
    });

    const done = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${task.id}`,
      headers,
      payload: { status: 'DONE' },
    });
    expect(done.json().completedAt).toEqual(expect.any(String));

    const reopened = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${task.id}`,
      headers,
      payload: { status: 'TODO' },
    });
    expect(reopened.json().completedAt).toBeNull();

    const del = await app.inject({ method: 'DELETE', url: `/api/tasks/${task.id}`, headers });
    expect(del.statusCode).toBe(204);
    expect(
      (await app.inject({ method: 'DELETE', url: `/api/tasks/${task.id}`, headers })).statusCode,
    ).toBe(404);
  });

  it('validates input', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const empty = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: '   ' },
    });
    expect(empty.statusCode).toBe(400);
    expect(empty.json().issues[0].path).toBe('title');
    const long = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: 'x'.repeat(501) },
    });
    expect(long.statusCode).toBe(400);
    const badDate = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      headers,
      payload: { title: 'a', dueAt: 'ertaga' },
    });
    expect(badDate.statusCode).toBe(400);
  });

  it('requires at least one field on PATCH', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const [first] = (await app.inject({ url: '/api/tasks', headers })).json().items;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${first.id}`,
      headers,
      payload: {},
    });
    expect(res.statusCode).toBe(400);
  });

  it('lists by due date with undated tasks last and filters by status', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const { items } = (await app.inject({ url: '/api/tasks', headers })).json();
    const dated = items.filter((t: { dueAt: string | null }) => t.dueAt);
    expect(dated.map((t: { dueAt: string }) => t.dueAt)).toEqual(
      [...dated.map((t: { dueAt: string }) => t.dueAt)].sort(),
    );
    expect(items.at(-1).dueAt).toBeNull();

    await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${items[0].id}`,
      headers,
      payload: { status: 'DONE' },
    });
    const open = (await app.inject({ url: '/api/tasks?status=TODO,IN_PROGRESS', headers })).json()
      .items;
    expect(open.every((t: { status: string }) => t.status !== 'DONE')).toBe(true);
    expect(open).toHaveLength(items.length - 1);
    expect((await app.inject({ url: '/api/tasks?status=BOGUS', headers })).statusCode).toBe(400);
  });

  it('filters by dueBefore', async () => {
    const app = await makeApp();
    const { headers } = await login(app);
    const before = new Date(Date.now() + 3 * 3_600_000).toISOString();
    const { items } = (
      await app.inject({ url: `/api/tasks?dueBefore=${encodeURIComponent(before)}`, headers })
    ).json();
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((t: { dueAt: string }) => t.dueAt < before)).toBe(true);
  });

  it("does not expose another user's tasks", async () => {
    const app = await makeApp();
    const a = await login(app, 'xodim');
    const b = await login(app, 'rahbar');
    const [aTask] = (await app.inject({ url: '/api/tasks', headers: a.headers })).json().items;
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${aTask.id}`,
      headers: b.headers,
      payload: { title: 'x' },
    });
    expect(res.statusCode).toBe(404);
    const ids = (await app.inject({ url: '/api/tasks', headers: b.headers }))
      .json()
      .items.map((t: { id: string }) => t.id);
    expect(ids).not.toContain(aTask.id);
  });
});

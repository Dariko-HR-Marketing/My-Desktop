/**
 * Post-deploy smoke test against a running server. Leaves no data behind (the temporary task is deleted,
 * settings are restored).
 *
 *   SMOKE_URL=https://my-desk.tajriba24.uz SMOKE_LOGIN=admin SMOKE_PASSWORD='…' npm run smoke -w @ish-maydoni/server
 *
 * The password is read from the environment so it never lands in shell history or logs.
 */
const base = (process.env.SMOKE_URL ?? 'http://localhost:8080').replace(/\/+$/, '');
const login = process.env.SMOKE_LOGIN ?? 'xodim';
const password = process.env.SMOKE_PASSWORD ?? '';
const expectStore = process.env.SMOKE_STORE; // e.g. "postgres"

let failed = 0;
const pass = (name: string, extra = '') =>
  console.log(`  ok    ${name}${extra ? ` — ${extra}` : ''}`);
const fail = (name: string, why: string) => {
  failed++;
  console.log(`  FAIL  ${name} — ${why}`);
};

async function call(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // non-JSON body
  }
  return { status: res.status, json };
}

async function step(name: string, fn: () => Promise<string | void>) {
  try {
    pass(name, (await fn()) ?? '');
  } catch (e) {
    fail(name, e instanceof Error ? e.message : String(e));
  }
}
const assert = (cond: unknown, msg: string) => {
  if (!cond) throw new Error(msg);
};

console.log(`Smoke test: ${base} as "${login}"`);
if (!password) {
  console.error('Set SMOKE_PASSWORD');
  process.exit(2);
}

let token = '';
let userId = '';

await step('health', async () => {
  const r = await call('GET', '/health');
  assert(r.status === 200 && r.json?.status === 'ok', `status ${r.status}`);
  if (expectStore)
    assert(r.json.store === expectStore, `store is ${r.json.store}, expected ${expectStore}`);
  return `store=${r.json.store}`;
});

await step('login rejects a wrong password with 401', async () => {
  const r = await call('POST', '/api/auth/login', undefined, {
    login,
    password: `${password}-wrong`,
  });
  assert(r.status === 401, `status ${r.status}`);
});

await step('login', async () => {
  const r = await call('POST', '/api/auth/login', undefined, { login, password });
  assert(r.status === 200 && r.json?.token, `status ${r.status}`);
  token = r.json.token;
  userId = r.json.user.id;
  return `role=${r.json.user.role}`;
});
if (!token) {
  console.log('\nCannot continue without a token.');
  process.exit(1);
}

await step('protected endpoint without a token is 401', async () => {
  assert((await call('GET', '/api/tasks')).status === 401, 'not 401');
});

await step('/api/me and settings', async () => {
  const r = await call('GET', '/api/me', token);
  assert(r.status === 200 && r.json.user.id === userId, `status ${r.status}`);
  const s = r.json.settings;
  for (const k of ['theme', 'density', 'fontSize', 'quietEnabled', 'quietFrom', 'sleepMinutes'])
    assert(k in s, `settings.${k} missing (migration 0003 applied?)`);
});

await step('task create → patch → delete (with assignee/list)', async () => {
  const c = await call('POST', '/api/tasks', token, {
    title: 'smoke test',
    assignee: 'Smoke',
    list: 'smoke',
    priority: 'LOW',
  });
  assert(
    c.status === 201 && c.json.assignee === 'Smoke' && c.json.list === 'smoke',
    `create ${c.status} (migration 0002 applied?)`,
  );
  const p = await call('PATCH', `/api/tasks/${c.json.id}`, token, { status: 'DONE' });
  assert(p.status === 200 && p.json.completedAt, `patch ${p.status}`);
  const d = await call('DELETE', `/api/tasks/${c.json.id}`, token);
  assert(d.status === 204, `delete ${d.status}`);
});

await step('validation error shape', async () => {
  const r = await call('POST', '/api/tasks', token, { title: '   ' });
  assert(
    r.status === 400 && r.json?.error === 'validation' && Array.isArray(r.json.issues),
    `status ${r.status}`,
  );
});

await step('settings patch and restore', async () => {
  const before = (await call('GET', '/api/settings', token)).json;
  const patched = await call('PATCH', '/api/settings', token, {
    sleepMinutes: before.sleepMinutes === 15 ? 20 : 15,
  });
  assert(
    patched.status === 200 && patched.json.sleepMinutes !== before.sleepMinutes,
    `status ${patched.status}`,
  );
  await call('PATCH', '/api/settings', token, { sleepMinutes: before.sleepMinutes });
});

await step('dashboard', async () => {
  const r = await call('GET', '/api/dashboard', token);
  assert(r.status === 200 && r.json.tasks && Array.isArray(r.json.signals), `status ${r.status}`);
  return `signals=${r.json.signals.length}`;
});

await step('catalog (apps and modules)', async () => {
  const apps = await call('GET', '/api/catalog/apps', token);
  const mods = await call('GET', '/api/catalog/modules', token);
  assert(apps.status === 200 && apps.json.items.length >= 10, `apps ${apps.status}`);
  assert(
    mods.status === 200 && mods.json.items.some((m: any) => m.key === 'edo'),
    `modules ${mods.status}`,
  );
});

await step('module data (edo)', async () => {
  const r = await call('GET', '/api/modules/edo/data', token);
  assert(
    r.status === 200 && r.json.documents?.length > 0 && r.json.control && r.json.assignments,
    `status ${r.status}`,
  );
  return `documents=${r.json.documents.length}`;
});

await step('calendar today (migration 0004)', async () => {
  const r = await call('GET', '/api/calendar/today', token);
  assert(
    r.status === 200 && typeof r.json.configured === 'boolean' && Array.isArray(r.json.items),
    `status ${r.status} (migration 0004 applied?)`,
  );
  return r.json.configured ? `events=${r.json.items.length}` : 'not configured';
});

await step('integrations (migration 0005, INTEGRATIONS_KEY)', async () => {
  const r = await call('GET', '/api/integrations/providers', token);
  assert(
    r.status === 200 && r.json.items?.length > 0,
    `status ${r.status} (migration 0005 applied?)`,
  );
  assert(
    r.json.enabled === true,
    'INTEGRATIONS_KEY is not set on the server (run deploy/update-server.sh)',
  );
  const list = await call('GET', '/api/integrations', token);
  assert(list.status === 200 && Array.isArray(list.json.items), `list ${list.status}`);
  return `providers=${r.json.items.length}`;
});

await step('notifications list', async () => {
  const r = await call('GET', '/api/notifications', token);
  assert(r.status === 200 && Array.isArray(r.json.items), `status ${r.status}`);
});

for (const w of ['currency', 'weather'] as const) {
  await step(`widget ${w}`, async () => {
    const r = await call('GET', `/api/widgets/${w}`, token);
    assert(r.status === 200 || r.status === 503, `status ${r.status}`); // 503 = external source down, acceptable
    return r.status === 200 ? `stale=${r.json.stale}` : 'upstream unavailable (503)';
  });
}

await step('websocket hello', async () => {
  const url = `${base.replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;
  const msg = await new Promise<string>((resolve, reject) => {
    const ws = new WebSocket(url);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('no hello within 8 s (is /ws proxied with upgrade headers?)'));
    }, 8000);
    ws.onmessage = (e) => {
      clearTimeout(timer);
      ws.close();
      resolve(String(e.data));
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('websocket error'));
    };
  });
  assert(JSON.parse(msg).type === 'hello', 'first message is not hello');
});

await step('websocket rejects a bad token (4401)', async () => {
  const code = await new Promise<number>((resolve, reject) => {
    const ws = new WebSocket(`${base.replace(/^http/, 'ws')}/ws?token=bad`);
    const timer = setTimeout(() => reject(new Error('no close within 8 s')), 8000);
    ws.onclose = (e) => {
      clearTimeout(timer);
      resolve(e.code);
    };
  });
  assert(code === 4401, `close code ${code}`);
});

console.log(failed === 0 ? '\nAll checks passed.' : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);

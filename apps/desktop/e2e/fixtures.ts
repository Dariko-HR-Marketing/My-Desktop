import type { Page } from '@playwright/test';

export const API = 'http://localhost:8080';
export type DemoUser = 'xodim' | 'rahbar' | 'admin';

export async function apiLogin(user: DemoUser = 'xodim') {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ login: user, password: 'demo12345' }),
  });
  const body = (await res.json()) as { token: string; user: { id: string } };
  return { token: body.token, userId: body.user.id };
}

export function client(token: string) {
  const call = async (method: string, path: string, body?: unknown) => {
    const res = await fetch(API + path, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(body ? { 'content-type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.status === 204 ? null : res.json();
  };
  return {
    get: (p: string) => call('GET', p),
    post: (p: string, b: unknown) => call('POST', p, b),
    patch: (p: string, b: unknown) => call('PATCH', p, b),
    del: (p: string) => call('DELETE', p),
  };
}

/** Signs in through the API and hands the token to the app, like a restored session. */
export async function signIn(
  page: Page,
  user: DemoUser = 'xodim',
  theme: 'light' | 'dark' = 'light',
) {
  const session = await apiLogin(user);
  await page.addInitScript(
    ({ token, theme }) => {
      sessionStorage.setItem('secure:session-token', token);
      localStorage.setItem(
        'ish-maydoni-ui',
        JSON.stringify({
          state: {
            theme,
            density: 'comfortable',
            fontSize: 'md',
            navCollapsed: false,
            networksOpen: true,
            sleepMinutes: 10,
          },
          version: 0,
        }),
      );
    },
    { token: session.token, theme },
  );
  return { ...session, api: client(session.token) };
}

export const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

export const uniq = (prefix: string) => `${prefix} ${Date.now().toString(36)}`;

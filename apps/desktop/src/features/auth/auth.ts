import type { User, UserSettings } from '@ish-maydoni/shared';
import { ApiError, NetworkError } from '../../lib/api';
import { api, setUnauthorizedHandler } from '../../lib/client';
import { clearCache, readCache, writeCache } from '../../lib/cache';
import { DEMO_SETTINGS, DEMO_USER } from '../../lib/demoData';
import { secureStorage } from '../../lib/platform';
import { useSession } from '../../state/session';
import { adoptServerSettings } from '../../lib/settingsSync';
import { useData } from '../../state/data';

const TOKEN_KEY = 'session-token';
type MeResponse = { user: User; settings: UserSettings };

export async function logout(): Promise<void> {
  useSession.getState().setAnon();
  useData.getState().reset();
  clearCache();
  await secureStorage.delete(TOKEN_KEY);
}

setUnauthorizedHandler(() => {
  if (useSession.getState().status === 'authed' && !useSession.getState().demo) void logout();
});

/** App start: restore the saved token, show the cached profile at once, then confirm with the server. */
export async function restoreSession(): Promise<void> {
  const { setSession, setAnon } = useSession.getState();
  let token: string | null = null;
  try {
    token = await secureStorage.get(TOKEN_KEY);
  } catch {
    token = null;
  }
  if (!token) return setAnon();

  const cached = readCache<MeResponse>('me')?.value;
  if (cached) setSession(token, cached.user, cached.settings);
  else useSession.setState({ token });

  try {
    const me = await api.get<MeResponse>('/api/me');
    writeCache('me', me);
    setSession(token, me.user, me.settings);
    adoptServerSettings(me.settings);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return; // onUnauthorized already signed out
    if (!cached) setAnon(); // offline and nothing to show
  }
}

export async function login(loginName: string, password: string): Promise<void> {
  const res = await api.post<{ token: string; user: User }>(
    '/api/auth/login',
    { login: loginName, password },
    { anonymous: true },
  );
  await secureStorage.set(TOKEN_KEY, res.token);
  useSession.getState().setSession(res.token, res.user, null);
  try {
    const me = await api.get<MeResponse>('/api/me');
    writeCache('me', me);
    useSession.getState().setUser(me.user, me.settings);
    adoptServerSettings(me.settings);
  } catch (err) {
    if (err instanceof NetworkError) return; // signed in; settings arrive on the next successful call
    throw err;
  }
}

export function enterDemo(): void {
  useSession.getState().enterDemo(DEMO_USER, DEMO_SETTINGS);
}

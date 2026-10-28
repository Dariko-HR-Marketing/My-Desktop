import { useMemo } from 'react';
import type { UserSettings } from '@ish-maydoni/shared';
import { ApiError, NetworkError } from './api';
import { writeCache } from './cache';
import { api } from './client';
import { t } from './i18n';
import { DEFAULT_SETTINGS } from './settings';
import { useSession } from '../state/session';
import { useToast } from '../state/toast';
import { useUi } from '../state/ui';

const PENDING_KEY = 'ish-settings-pending';
const UI_KEYS = ['theme', 'density', 'fontSize', 'navCollapsed', 'sleepMinutes'] as const;

function loadPending(): Partial<UserSettings> {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? '{}') as Partial<UserSettings>;
  } catch {
    return {};
  }
}
function savePending(p: Partial<UserSettings>) {
  try {
    if (Object.keys(p).length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(p));
  } catch {
    // best effort
  }
}

/** Settings as the user sees them: server values (when signed in) with this device's appearance on top. */
export function useSettings(): UserSettings {
  const base = useSession((s) => s.settings);
  const theme = useUi((s) => s.theme);
  const density = useUi((s) => s.density);
  const fontSize = useUi((s) => s.fontSize);
  const navCollapsed = useUi((s) => s.navCollapsed);
  const sleepMinutes = useUi((s) => s.sleepMinutes);
  return useMemo(
    () => ({ ...DEFAULT_SETTINGS, ...base, theme, density, fontSize, navCollapsed, sleepMinutes }),
    [base, theme, density, fontSize, navCollapsed, sleepMinutes],
  );
}

/** Server settings arrived (login, restore, realtime): adopt them, but keep changes still waiting to be sent. */
export function adoptServerSettings(server: UserSettings): void {
  const merged = { ...DEFAULT_SETTINGS, ...server, ...loadPending() };
  const ui: Partial<Record<(typeof UI_KEYS)[number], unknown>> = {};
  for (const k of UI_KEYS) ui[k] = merged[k];
  useUi.getState().setLocal(ui as Parameters<ReturnType<typeof useUi.getState>['setLocal']>[0]);
  useSession.getState().setSettings(merged);
}

/** Apply a change at once (local state, cache), then send it; offline changes are kept and retried. */
export function updateSettings(patch: Partial<UserSettings>): void {
  const ui: Record<string, unknown> = {};
  for (const k of UI_KEYS) if (k in patch) ui[k] = patch[k];
  if (Object.keys(ui).length) useUi.getState().setLocal(ui);

  const session = useSession.getState();
  const next = { ...DEFAULT_SETTINGS, ...session.settings, ...patch };
  session.setSettings(next);
  if (session.user) writeCache('me', { user: session.user, settings: next });

  if (session.demo || !session.token) return;
  savePending({ ...loadPending(), ...patch });
  void flushSettings();
}

let flushing = false;
export async function flushSettings(): Promise<void> {
  const pending = loadPending();
  if (flushing || Object.keys(pending).length === 0 || !useSession.getState().token) return;
  flushing = true;
  try {
    await api.patch<UserSettings>('/api/settings', pending);
    const rest = loadPending();
    for (const k of Object.keys(pending) as (keyof UserSettings)[])
      if (JSON.stringify(rest[k]) === JSON.stringify(pending[k])) delete rest[k];
    savePending(rest);
  } catch (err) {
    if (err instanceof NetworkError) return; // try again later
    if (err instanceof ApiError) {
      savePending({});
      useToast.getState().push(t('state.undone'));
    }
  } finally {
    flushing = false;
  }
}

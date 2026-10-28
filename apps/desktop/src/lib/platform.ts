import { invoke } from '@tauri-apps/api/core';

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

/**
 * Secret storage. In the desktop app it is the OS credential store (Rust `secure_*` commands).
 * In a plain browser (vite dev only) it falls back to sessionStorage, which is cleared when the tab closes.
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (isTauri()) return (await invoke<string | null>('secure_get', { key })) ?? null;
    try {
      return sessionStorage.getItem(`secure:${key}`);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (isTauri()) return invoke('secure_set', { key, value });
    try {
      sessionStorage.setItem(`secure:${key}`, value);
    } catch {
      // storage unavailable: the session just won't survive a restart
    }
  },
  async delete(key: string): Promise<void> {
    if (isTauri()) return invoke('secure_delete', { key });
    try {
      sessionStorage.removeItem(`secure:${key}`);
    } catch {
      // nothing to remove
    }
  },
};

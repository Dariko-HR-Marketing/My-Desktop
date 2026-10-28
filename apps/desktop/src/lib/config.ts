const STORAGE_KEY = 'ish-server-url';
const DEFAULT_URL = import.meta.env.DEV ? 'http://localhost:8080' : 'https://my-desk.tajriba24.uz';

/** API base URL. Overridable from Settings (stage 7) via localStorage; never hardcoded elsewhere. */
export function serverUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && /^https?:\/\//.test(saved)) return saved.replace(/\/+$/, '');
  } catch {
    // storage unavailable: use the default
  }
  return import.meta.env.VITE_API_URL ?? DEFAULT_URL;
}

export const wsUrl = (token: string) =>
  `${serverUrl().replace(/^http/, 'ws')}/ws?token=${encodeURIComponent(token)}`;

export const APP_VERSION = '0.1.0';

export interface Cached<T> {
  value: T;
  savedAt: number;
}

const PREFIX = 'ish-cache:';

/** Last API responses, shown first on the next launch. Per-user keys; cleared on sign-out. */
export function readCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, now = Date.now()): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ value, savedAt: now } satisfies Cached<T>));
  } catch {
    // quota or private mode: caching is best-effort
  }
}

export function clearCache(): void {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // nothing to clear
  }
}

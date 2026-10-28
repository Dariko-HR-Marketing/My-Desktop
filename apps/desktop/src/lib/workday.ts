const KEY = 'ish-first-open';

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/**
 * When the app was first opened today (local time). Remembered per calendar day on this device, so the
 * home page can show "you started at 08:52" without any server source.
 */
export function firstOpenToday(
  now: Date = new Date(),
  storage: Pick<Storage, 'getItem' | 'setItem'> | null = safeStorage(),
): Date {
  try {
    const saved = storage
      ? (JSON.parse(storage.getItem(KEY) ?? 'null') as { day: string; at: string } | null)
      : null;
    if (saved && saved.day === dayKey(now)) return new Date(saved.at);
    storage?.setItem(KEY, JSON.stringify({ day: dayKey(now), at: now.toISOString() }));
  } catch {
    // storage unavailable: fall back to "now"
  }
  return now;
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

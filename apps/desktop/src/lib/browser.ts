import { NETWORKS } from '../features/browser/networks';
import { GOOGLE_SEARCH, WORK_SITES } from '../features/browser/sites';

export type Address = { kind: 'url' | 'search'; url: string } | { kind: 'invalid' };

const HOSTNAME =
  /^(localhost|(\d{1,3}\.){3}\d{1,3}|([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,})(:\d{1,5})?(\/.*)?(\?.*)?(#.*)?$/i;

/**
 * Address bar input → what to open.
 * http(s) URLs open as is; bare hostnames get https://; any other scheme (file:, javascript:, data:, …) is refused;
 * everything else is a Google search.
 */
export function normalizeAddress(input: string): Address {
  const text = input.trim();
  if (!text) return { kind: 'invalid' };

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(text);
  const looksLikeHostPort = /^[^\s/:]+:\d{1,5}(\/|$)/.test(text);
  if (scheme && !looksLikeHostPort) {
    if (!/^https?$/i.test(scheme[1]!)) return { kind: 'invalid' };
    try {
      const url = new URL(text);
      return url.hostname ? { kind: 'url', url: url.toString() } : { kind: 'invalid' };
    } catch {
      return { kind: 'invalid' };
    }
  }

  if (!/\s/.test(text) && HOSTNAME.test(text)) {
    const withScheme = /^(localhost|\d)/i.test(text) ? `http://${text}` : `https://${text}`;
    try {
      return { kind: 'url', url: new URL(withScheme).toString() };
    } catch {
      // fall through to search
    }
  }
  return { kind: 'search', url: GOOGLE_SEARCH + encodeURIComponent(text) };
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function appKeyForUrl(url: string): string | null {
  const host = hostOf(url);
  if (!host) return null;
  return (
    NETWORKS.find((n) => n.hosts.some((h) => host === h || host.endsWith(`.${h}`)))?.key ?? null
  );
}

/** Tab group from what the tab shows: messengers → "muloqot", government/work sites → "ish". */
export function groupForUrl(url: string): 'muloqot' | 'ish' | null {
  const app = appKeyForUrl(url);
  if (app === 'telegram' || app === 'whatsapp') return 'muloqot';
  const host = hostOf(url);
  return WORK_SITES.some((s) => hostOf(s.url) === host) ? 'ish' : null;
}

/** "(12) Telegram" → 12. Mirrors the Rust parser so the dev (no-Tauri) path behaves the same. */
export function parseUnread(title: string): number {
  const m = /^\s*\((\d+)\+?\)/.exec(title);
  return m ? Number(m[1]) : 0;
}

export const isSecure = (url: string) => url.startsWith('https://');

export function displayUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname === '/' ? '' : u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

/** Messengers keep their webview alive even when idle, otherwise their unread counters would stop. */
export const NEVER_SLEEP_APPS = new Set(['telegram', 'whatsapp']);

export interface SleepCandidate {
  id: string;
  live: boolean;
  lastActive: number;
  appKey: string | null;
}

export function tabsToSleep(
  tabs: SleepCandidate[],
  activeId: string | null,
  now: number,
  sleepMs: number,
): string[] {
  return tabs
    .filter(
      (t) =>
        t.live &&
        t.id !== activeId &&
        now - t.lastActive >= sleepMs &&
        !(t.appKey && NEVER_SLEEP_APPS.has(t.appKey)),
    )
    .map((t) => t.id);
}

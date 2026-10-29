import { lookup as dnsLookup } from 'node:dns';
import { isIP } from 'node:net';
import { Agent, fetch as undiciFetch } from 'undici';

/**
 * The server downloads a calendar from an address the *user* typed, so it must never be turned into a way to reach
 * internal services (SSRF). Rules: https only, no credentials in the URL, no IP-literal or localhost hosts, and every
 * resolved address must be public. The address check happens in the connection's own DNS lookup, so a hostname cannot
 * resolve to a public address for the check and to a private one for the connection.
 */
export class UnsafeUrlError extends Error {}

export function isPrivateAddress(address: string): boolean {
  const v = isIP(address);
  if (v === 4) {
    const [a, b] = address.split('.').map(Number) as [number, number];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (v === 6) {
    const lower = address.toLowerCase();
    if (lower === '::' || lower === '::1') return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPrivateAddress(mapped[1]!);
    return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower) || lower.startsWith('ff');
  }
  return true; // not an IP at all: refuse
}

/** Static checks on the URL itself (no DNS). Throws UnsafeUrlError with a user-presentable message. */
export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError('Manzil notoʻgʻri');
  }
  if (url.protocol !== 'https:') throw new UnsafeUrlError('Faqat https:// manzil qabul qilinadi');
  if (url.username || url.password)
    throw new UnsafeUrlError('Manzilda login yoki parol boʻlmasligi kerak');
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new UnsafeUrlError('Bu manzilga ruxsat yoʻq');
  }
  if (isIP(host)) throw new UnsafeUrlError('IP manzil emas, domen nomi kerak');
  return url;
}

const guardedAgent = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
        if (err) return callback(err, '', 4);
        const list = addresses as { address: string; family: number }[];
        if (list.length === 0 || list.some((a) => isPrivateAddress(a.address))) {
          return callback(
            new UnsafeUrlError('Bu manzilga ruxsat yoʻq') as NodeJS.ErrnoException,
            '',
            4,
          );
        }
        // undici asks for all addresses when `all` is set on the options
        if ((options as { all?: boolean }).all) return (callback as any)(null, list);
        return callback(null, list[0]!.address, list[0]!.family);
      });
    },
  },
});

export type TextFetcher = (url: string) => Promise<string>;

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;

/** Downloads a text resource safely: guarded DNS, redirects re-validated, size and time limits. */
export function createSafeTextFetcher(
  opts: { fetchImpl?: typeof undiciFetch; timeoutMs?: number } = {},
): TextFetcher {
  const doFetch = opts.fetchImpl ?? undiciFetch;
  const timeoutMs = opts.timeoutMs ?? 8000;
  return async (raw) => {
    let url = assertSafeUrl(raw);
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const res = await doFetch(url, {
        redirect: 'manual',
        dispatcher: guardedAgent,
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'text/calendar, text/plain, */*' },
      });
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        url = assertSafeUrl(new URL(res.headers.get('location')!, url).toString());
        continue;
      }
      if (!res.ok) throw new Error(`upstream ${res.status}`);
      const declared = Number(res.headers.get('content-length') ?? 0);
      if (declared > MAX_BYTES) throw new Error('response too large');
      const reader = res.body?.getReader();
      if (!reader) return await res.text();
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > MAX_BYTES) {
          await reader.cancel();
          throw new Error('response too large');
        }
        chunks.push(value);
      }
      return Buffer.concat(chunks).toString('utf8');
    }
    throw new Error('too many redirects');
  };
}

export interface HttpRequest {
  method: 'GET' | 'POST';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
}
export interface HttpResult {
  status: number;
  text: string;
}
export type HttpClient = (req: HttpRequest) => Promise<HttpResult>;

/**
 * Outbound calls to services the administrator configured (AI providers, Telegram, a custom REST address…).
 * Same guards as the calendar download (https only, guarded DNS, size/time limits), and redirects are never followed:
 * credentials in the headers must not travel to a host the administrator did not enter.
 */
export function createSafeHttp(opts: { fetchImpl?: typeof undiciFetch } = {}): HttpClient {
  const doFetch = opts.fetchImpl ?? undiciFetch;
  return async (req) => {
    const url = assertSafeUrl(req.url);
    const res = await doFetch(url, {
      method: req.method,
      redirect: 'manual',
      dispatcher: guardedAgent,
      signal: AbortSignal.timeout(req.timeoutMs ?? 10_000),
      headers: req.headers,
      body: req.body,
    });
    const reader = res.body?.getReader();
    if (!reader) return { status: res.status, text: '' };
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new Error('response too large');
      }
      chunks.push(value);
    }
    return { status: res.status, text: Buffer.concat(chunks).toString('utf8') };
  };
}

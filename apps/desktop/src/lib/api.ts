export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly issues?: { path: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The server could not be reached (offline, DNS, timeout). */
export class NetworkError extends Error {
  constructor(message = 'network') {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface ApiOptions {
  baseUrl(): string;
  getToken(): string | null;
  /** Called on a 401 from an authenticated request; the app signs the user out. */
  onUnauthorized(): void;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

interface RequestOptions {
  body?: unknown;
  /** Skip the Authorization header and the 401 → sign-out handling (used by login). */
  anonymous?: boolean;
}

export function createApi(opts: ApiOptions) {
  const doFetch = opts.fetchFn ?? ((...a: Parameters<typeof fetch>) => fetch(...a));
  const timeoutMs = opts.timeoutMs ?? 10_000;

  async function request<T>(method: string, path: string, o: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = {};
    if (o.body !== undefined) headers['content-type'] = 'application/json';
    const token = o.anonymous ? null : opts.getToken();
    if (token) headers.authorization = `Bearer ${token}`;

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await doFetch(opts.baseUrl() + path, {
        method,
        headers,
        body: o.body === undefined ? undefined : JSON.stringify(o.body),
        signal: ctrl.signal,
      });
    } catch (err) {
      throw new NetworkError(err instanceof Error ? err.message : 'network');
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 204) return undefined as T;
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // empty or non-JSON body
    }
    if (!res.ok) {
      if (res.status === 401 && !o.anonymous) opts.onUnauthorized();
      const err = (data ?? {}) as {
        error?: string;
        message?: string;
        issues?: { path: string; message: string }[];
      };
      throw new ApiError(
        res.status,
        err.error ?? 'error',
        err.message ?? `HTTP ${res.status}`,
        err.issues,
      );
    }
    return data as T;
  }

  return {
    get: <T>(path: string) => request<T>('GET', path),
    post: <T>(path: string, body?: unknown, o?: { anonymous?: boolean }) =>
      request<T>('POST', path, { body: body ?? {}, anonymous: o?.anonymous }),
    patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, { body }),
    delete: <T = void>(path: string) => request<T>('DELETE', path),
  };
}

export type Api = ReturnType<typeof createApi>;

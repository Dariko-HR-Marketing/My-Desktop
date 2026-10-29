import {
  providerByKey,
  type IntegrationAuth,
  type IntegrationProvider,
  type IntegrationStatus,
  type Role,
} from '@ish-maydoni/shared';
import { httpError } from '../errors.js';
import { assertSafeUrl, UnsafeUrlError, type HttpClient, type HttpRequest } from './ssrf.js';
import type { Vault } from './vault.js';
import type { IntegrationRow, Store } from '../store/store.js';

const ORG = 'org';
export const ownerFor = (p: IntegrationProvider, userId: string) =>
  p.scope === 'org' ? ORG : userId;

const fill = (tpl: string, fields: Record<string, string>) =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => fields[k] ?? '');

/** Builds the outgoing request for a provider: placeholders filled, credentials attached according to `auth`. */
export function signRequest(
  provider: IntegrationProvider,
  fields: Record<string, string>,
  req: Pick<HttpRequest, 'method' | 'url' | 'body'> & { headers?: Record<string, string> },
): HttpRequest {
  const auth: IntegrationAuth = provider.auth;
  let url = fill(req.url, fields).replace(/([^:])\/{2,}/g, '$1/');
  const headers: Record<string, string> = { accept: 'application/json', ...req.headers };
  if (auth.kind === 'header') {
    const value = fields[auth.field];
    if (value) headers[fill(auth.header, fields).toLowerCase()] = `${auth.prefix ?? ''}${value}`;
    Object.assign(headers, auth.extra);
  } else if (auth.kind === 'bearer') {
    const value = fields[auth.field];
    if (value) headers.authorization = `Bearer ${value}`;
    Object.assign(headers, auth.extra);
  }
  if (req.body !== undefined) headers['content-type'] ??= 'application/json';
  return { method: req.method, url, headers, body: req.body };
}

const hintOf = (value: string, secret: boolean) =>
  secret ? (value.length > 8 ? `••••${value.slice(-4)}` : '••••') : value;

export interface IntegrationService {
  /** Whether credentials can be stored (INTEGRATIONS_KEY configured). */
  readonly enabled: boolean;
  status(
    provider: IntegrationProvider,
    userId: string,
    reveal: boolean,
  ): Promise<IntegrationStatus>;
  save(provider: IntegrationProvider, userId: string, input: Record<string, string>): Promise<void>;
  remove(provider: IntegrationProvider, userId: string): Promise<boolean>;
  test(provider: IntegrationProvider, userId: string): Promise<{ ok: boolean; message: string }>;
  /** For server-side adapters: the decrypted fields, or null when not connected. */
  credentials(providerKey: string, userId: string): Promise<Record<string, string> | null>;
}

export function createIntegrationService(deps: {
  store: Store;
  vault: Vault | null;
  http: HttpClient;
  now: () => Date;
}): IntegrationService {
  const { store, vault, http, now } = deps;

  const read = (row: IntegrationRow): Record<string, string> => {
    try {
      return vault!.decrypt(row.dataEnc);
    } catch {
      return {}; // key rotated or data damaged: treat as not usable instead of failing the whole list
    }
  };
  const needVault = () => {
    if (!vault) {
      throw httpError(
        503,
        'integrations_disabled',
        'Integratsiyalar yoqilmagan: serverda INTEGRATIONS_KEY sozlanmagan',
      );
    }
    return vault;
  };

  return {
    enabled: vault !== null,

    async status(provider, userId, reveal) {
      const row = vault
        ? await store.integrations.get(ownerFor(provider, userId), provider.key)
        : null;
      const data = row ? read(row) : {};
      const connected = !!row && Object.keys(data).length > 0;
      return {
        key: provider.key,
        connected,
        fields: reveal
          ? provider.fields.map((f) => ({
              key: f.key,
              set: !!data[f.key],
              hint: data[f.key] ? hintOf(data[f.key]!, f.secret) : '',
            }))
          : [],
        updatedAt: row ? row.updatedAt.toISOString() : null,
        lastTest:
          row && row.lastTestAt
            ? {
                ok: !!row.lastTestOk,
                at: row.lastTestAt.toISOString(),
                message: row.lastTestMessage ?? '',
              }
            : null,
      };
    },

    async save(provider, userId, input) {
      const v = needVault();
      const owner = ownerFor(provider, userId);
      const existing = await store.integrations.get(owner, provider.key);
      const previous = existing ? read(existing) : {};
      const next: Record<string, string> = {};
      for (const f of provider.fields) {
        const given = input[f.key]?.trim();
        // an empty secret on an already connected service means "keep the stored one"
        const value = given || (f.secret ? previous[f.key] : undefined) || f.defaultValue || '';
        if (!value) {
          if (f.required) throw httpError(400, 'validation', `«${f.label}» majburiy`);
          continue;
        }
        if (value.length > 2000) throw httpError(400, 'validation', `«${f.label}» juda uzun`);
        if (f.url) {
          try {
            assertSafeUrl(value);
          } catch (e) {
            throw httpError(
              400,
              'validation',
              `«${f.label}»: ${e instanceof UnsafeUrlError ? e.message : 'manzil notoʻgʻri'}`,
            );
          }
        }
        next[f.key] = f.url ? value.replace(/\/+$/, '') : value;
      }
      await store.integrations.upsert(owner, provider.key, v.encrypt(next), now());
    },

    async remove(provider, userId) {
      return store.integrations.remove(ownerFor(provider, userId), provider.key);
    },

    async credentials(providerKey, userId) {
      const provider = providerByKey(providerKey);
      if (!provider || !vault) return null;
      const row = await store.integrations.get(ownerFor(provider, userId), providerKey);
      if (!row) return null;
      const data = read(row);
      return Object.keys(data).length ? data : null;
    },

    async test(provider, userId) {
      const owner = ownerFor(provider, userId);
      const row = vault ? await store.integrations.get(owner, provider.key) : null;
      const fields = row ? read(row) : {};
      if (!row || Object.keys(fields).length === 0)
        return { ok: false, message: 'Avval kalitni kiriting va saqlang' };
      let result: { ok: boolean; message: string };
      if (!provider.test) {
        result = {
          ok: true,
          message: 'Saqlandi. Bu turdagi ulanish uchun avtomatik tekshiruv yoʻq',
        };
      } else {
        try {
          const res = await http(
            signRequest(provider, fields, {
              method: provider.test.method,
              url: provider.test.url,
              body: provider.test.method === 'POST' ? '{}' : undefined,
            }),
          );
          if (res.status === 401 || res.status === 403) {
            result = { ok: false, message: 'Xizmat kalitni qabul qilmadi (401/403)' };
          } else if (res.status < 200 || res.status >= 300) {
            result = { ok: false, message: `Xizmat kutilmagan javob berdi (${res.status})` };
          } else if (provider.test.expect === 'ok' && !jsonOk(res.text)) {
            result = { ok: false, message: 'Xizmat kalitni qabul qilmadi' };
          } else {
            result = { ok: true, message: 'Ulanish ishlayapti' };
          }
        } catch (e) {
          result = {
            ok: false,
            message:
              e instanceof UnsafeUrlError
                ? e.message
                : 'Xizmatga ulanib boʻlmadi (manzil yoki tarmoqni tekshiring)',
          };
        }
      }
      await store.integrations.setTest(owner, provider.key, result.ok, result.message, now());
      return result;
    },
  };
}

function jsonOk(text: string): boolean {
  try {
    return (JSON.parse(text) as { ok?: unknown }).ok === true;
  } catch {
    return false;
  }
}

export const canManage = (provider: IntegrationProvider, role: Role) =>
  provider.scope === 'user' || role === 'ADMIN';

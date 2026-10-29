import { describe, expect, it } from 'vitest';
import { providerByKey, type IntegrationStatus } from '@ish-maydoni/shared';
import { INTEGRATION_PROVIDERS } from '@ish-maydoni/shared';
import {
  canEdit,
  connectionState,
  groupProviders,
  initialForm,
  missingFields,
  payloadFor,
} from './integrations';

const status = (over: Partial<IntegrationStatus> = {}): IntegrationStatus => ({
  key: 'edo',
  connected: true,
  fields: [
    { key: 'baseUrl', set: true, hint: 'https://edo.uz/api' },
    { key: 'apiKey', set: true, hint: '••••abcd' },
  ],
  updatedAt: '2026-10-29T10:00:00Z',
  lastTest: null,
  ...over,
});

describe('integrations logic', () => {
  it('groups the catalog by category in a fixed order', () => {
    const groups = groupProviders(INTEGRATION_PROVIDERS);
    expect(groups.map((g) => g.category)).toEqual(['ai', 'messenger', 'work', 'gov', 'custom']);
    expect(groups[0]!.items.map((p) => p.key)).toContain('anthropic');
  });

  it('lets only administrators edit organisation-wide services', () => {
    expect(canEdit(providerByKey('openai')!, 'EMPLOYEE')).toBe(false);
    expect(canEdit(providerByKey('openai')!, 'ADMIN')).toBe(true);
    expect(canEdit(providerByKey('github')!, 'EMPLOYEE')).toBe(true);
  });

  it('derives the connection state', () => {
    expect(connectionState(undefined)).toBe('none');
    expect(connectionState(status({ connected: false }))).toBe('none');
    expect(connectionState(status())).toBe('saved');
    expect(connectionState(status({ lastTest: { ok: true, at: 'x', message: '' } }))).toBe('ok');
    expect(connectionState(status({ lastTest: { ok: false, at: 'x', message: '' } }))).toBe(
      'failed',
    );
  });

  it('starts the form with saved non-secret values and empty secrets', () => {
    const edo = providerByKey('edo')!;
    expect(initialForm(edo, status())).toEqual({ baseUrl: 'https://edo.uz/api', apiKey: '' });
    expect(initialForm(edo, undefined)).toEqual({ baseUrl: '', apiKey: '' });
    expect(initialForm(providerByKey('rest')!, undefined).header).toBe('Authorization');
  });

  it('treats a stored secret as filled when checking required fields', () => {
    const edo = providerByKey('edo')!;
    expect(missingFields(edo, { baseUrl: '', apiKey: '' }, undefined)).toEqual([
      'baseUrl',
      'apiKey',
    ]);
    expect(missingFields(edo, { baseUrl: 'https://edo.uz/api', apiKey: '' }, status())).toEqual([]);
    expect(missingFields(edo, { baseUrl: 'https://edo.uz/api', apiKey: '' }, undefined)).toEqual([
      'apiKey',
    ]);
  });

  it('trims the payload', () => {
    expect(payloadFor(providerByKey('openai')!, { apiKey: '  sk-1 ' })).toEqual({ apiKey: 'sk-1' });
  });
});

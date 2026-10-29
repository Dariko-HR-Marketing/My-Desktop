import type {
  IntegrationCategory,
  IntegrationProvider,
  IntegrationStatus,
  Role,
} from '@ish-maydoni/shared';

export const CATEGORY_ORDER: IntegrationCategory[] = ['ai', 'messenger', 'work', 'gov', 'custom'];

export function groupProviders(
  providers: IntegrationProvider[],
): { category: IntegrationCategory; items: IntegrationProvider[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: providers.filter((p) => p.category === category),
  })).filter((g) => g.items.length > 0);
}

/** Organisation-wide services are managed by administrators; personal ones by their owner. */
export const canEdit = (p: IntegrationProvider, role: Role | undefined) =>
  p.scope === 'user' || role === 'ADMIN';

export type ConnectionState = 'none' | 'saved' | 'ok' | 'failed';

export function connectionState(status: IntegrationStatus | undefined): ConnectionState {
  if (!status?.connected) return 'none';
  if (!status.lastTest) return 'saved';
  return status.lastTest.ok ? 'ok' : 'failed';
}

/** Form values to start from: non-secret fields show what is saved, secrets always start empty ("keep" on save). */
export function initialForm(
  p: IntegrationProvider,
  status: IntegrationStatus | undefined,
): Record<string, string> {
  const form: Record<string, string> = {};
  for (const f of p.fields) {
    const saved = status?.fields.find((x) => x.key === f.key);
    form[f.key] = f.secret ? '' : saved?.set ? saved.hint : (f.defaultValue ?? '');
  }
  return form;
}

/** Missing required fields; a secret already stored on the server counts as filled. */
export function missingFields(
  p: IntegrationProvider,
  form: Record<string, string>,
  status: IntegrationStatus | undefined,
): string[] {
  return p.fields
    .filter((f) => {
      if (!f.required) return false;
      if (form[f.key]?.trim()) return false;
      return !(f.secret && status?.fields.find((x) => x.key === f.key)?.set);
    })
    .map((f) => f.key);
}

export const payloadFor = (p: IntegrationProvider, form: Record<string, string>) =>
  Object.fromEntries(p.fields.map((f) => [f.key, (form[f.key] ?? '').trim()]));

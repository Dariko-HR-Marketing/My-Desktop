import type { ModuleSignal, Role } from '@ish-maydoni/shared';

export interface ModuleAdapter {
  key: string;
  signals(ctx: { userId: string; role: Role }): Promise<ModuleSignal[]>;
}

/** Demo adapter for the document workflow module; replaced when the real EDO API is available. */
export const edoAdapter: ModuleAdapter = {
  key: 'edo',
  async signals() {
    return [
      {
        moduleKey: 'edo',
        label: 'Imzo kutmoqda',
        count: 4,
        tone: 'warning',
        url: 'module://edo/documents',
      },
      {
        moduleKey: 'edo',
        label: 'Muddati oʻtgan',
        count: 2,
        tone: 'danger',
        url: 'module://edo/control',
      },
    ];
  },
};

export const defaultAdapters: ModuleAdapter[] = [edoAdapter];

/** One failing module must not hide the others. */
export async function collectSignals(
  adapters: ModuleAdapter[],
  allowedKeys: Set<string>,
  ctx: { userId: string; role: Role },
): Promise<ModuleSignal[]> {
  const active = adapters.filter((a) => allowedKeys.has(a.key));
  const results = await Promise.allSettled(active.map((a) => a.signals(ctx)));
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}

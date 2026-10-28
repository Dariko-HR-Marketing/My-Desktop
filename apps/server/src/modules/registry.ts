import { buildEdoData, edoSignals, type ModuleSignal, type Role } from '@ish-maydoni/shared';

export interface ModuleAdapter {
  key: string;
  signals(ctx: { userId: string; role: Role }): Promise<ModuleSignal[]>;
  /** Module-specific payload for its screens (GET /api/modules/:key/data). */
  data?(ctx: { userId: string; role: Role }): Promise<unknown>;
}

/** Demo adapter for the document workflow module; replaced when the real EDO API is available. */
export const makeEdoAdapter = (now: () => Date = () => new Date()): ModuleAdapter => ({
  key: 'edo',
  signals: async () => edoSignals(now()),
  data: async () => buildEdoData(now()),
});

export const edoAdapter = makeEdoAdapter();

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

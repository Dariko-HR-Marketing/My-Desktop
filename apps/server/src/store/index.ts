import type { Config } from '../config.js';
import { createMemoryStore } from './memory.js';
import type { Store } from './store.js';

export async function createStore(config: Config): Promise<Store> {
  if (config.DATA_STORE === 'postgres') {
    const { createPrismaStore } = await import('./prisma.js');
    return createPrismaStore(config.DATABASE_URL!);
  }
  return createMemoryStore({ bcryptRounds: config.BCRYPT_ROUNDS });
}

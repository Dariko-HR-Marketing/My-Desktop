import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  DATA_STORE: z.enum(['memory', 'postgres']).default('memory'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(16).optional(),
  CORS_ORIGINS: z
    .string()
    .default('tauri://localhost,http://tauri.localhost,http://localhost:1420')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  JWT_EXPIRES_IN: z.string().default('12h'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  LOGIN_RATE_MAX: z.coerce.number().int().min(1).default(10),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
  /** base64 of 32 random bytes; encrypts stored integration keys. Without it integrations stay disabled (503). */
  INTEGRATIONS_KEY: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(10).optional(),
});

export type Config = Omit<z.infer<typeof schema>, 'JWT_SECRET'> & { JWT_SECRET: string };

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = schema.parse(env);
  if (parsed.DATA_STORE === 'postgres' && !parsed.DATABASE_URL) {
    throw new Error('DATABASE_URL is required when DATA_STORE=postgres');
  }
  if (parsed.NODE_ENV === 'production' && !parsed.JWT_SECRET) {
    throw new Error('JWT_SECRET is required in production');
  }
  // Dev/test fallback is a random per-process secret, never a hardcoded one.
  const secret = parsed.JWT_SECRET ?? `dev-${crypto.randomUUID()}-${crypto.randomUUID()}`;
  // Dev/test: a throwaway key so integrations can be tried locally. Production never invents one (data would be unreadable after restart).
  const integrationsKey =
    parsed.INTEGRATIONS_KEY ??
    (parsed.NODE_ENV === 'production' ? undefined : randomBytes(32).toString('base64'));
  return { ...parsed, JWT_SECRET: secret, INTEGRATIONS_KEY: integrationsKey };
}

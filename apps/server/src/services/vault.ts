import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

/**
 * Encrypts integration credentials at rest (AES-256-GCM, random 96-bit nonce per value, authenticated).
 * Format: "v1.<iv>.<tag>.<ciphertext>" (base64url). The key never reaches the database or the repository.
 */
export interface Vault {
  encrypt(value: Record<string, string>): string;
  decrypt(blob: string): Record<string, string>;
}

export function createVault(keyBase64: string): Vault {
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('INTEGRATIONS_KEY must be base64 of exactly 32 bytes');
  return {
    encrypt(value) {
      const iv = randomBytes(12);
      const cipher = createCipheriv('aes-256-gcm', key, iv);
      const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
      return ['v1', iv, cipher.getAuthTag(), data]
        .map((p) => (typeof p === 'string' ? p : p.toString('base64url')))
        .join('.');
    },
    decrypt(blob) {
      const [v, iv, tag, data] = blob.split('.');
      if (v !== 'v1' || !iv || !tag || !data) throw new Error('unsupported ciphertext');
      const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
      decipher.setAuthTag(Buffer.from(tag, 'base64url'));
      const plain = Buffer.concat([
        decipher.update(Buffer.from(data, 'base64url')),
        decipher.final(),
      ]);
      return JSON.parse(plain.toString('utf8')) as Record<string, string>;
    },
  };
}

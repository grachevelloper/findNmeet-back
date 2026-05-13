import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class TokenCrypto {
  private readonly key: Buffer;
  readonly keyId = 'default';

  constructor(secret = process.env.TOKEN_ENCRYPTION_KEY) {
    if (!secret && process.env.NODE_ENV === 'production') {
      throw new Error('TOKEN_ENCRYPTION_KEY is required in production');
    }

    this.key = createHash('sha256').update(secret || 'findnmeet-local-token-encryption-key').digest();
  }

  encrypt(value: string): string {
    if (!value) {
      return '';
    }

    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, ciphertext]).toString('base64url');
  }

  decrypt(value: string): string {
    if (!value) {
      return '';
    }

    const payload = Buffer.from(value, 'base64url');
    const iv = payload.subarray(0, IV_BYTES);
    const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_BYTES });
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
}

export abstract class TokenCipher {
  abstract readonly keyId: string;
  abstract encrypt(value: string): string;
  abstract decrypt(value: string): string;
}

import { createPublicKey, verify as cryptoVerify } from 'crypto';
import { Injectable } from '@nestjs/common';

export type VerifiedAccessToken = {
  sub: string;
  exp: number;
  iat: number;
  typ: 'access';
  roles?: string[];
};

@Injectable()
export class AccessTokenVerifier {
  private readonly verificationKey?: string;

  constructor() {
    const publicKey = normalizePem(process.env.USER_JWT_PUBLIC_KEY ?? process.env.JWT_PUBLIC_KEY);
    if (!publicKey && process.env.NODE_ENV === 'production') {
      throw new Error('USER_JWT_PUBLIC_KEY or JWT_PUBLIC_KEY is required in production');
    }

    this.verificationKey = publicKey || undefined;
  }

  verify(accessToken: string, now = new Date()): VerifiedAccessToken {
    if (!this.verificationKey) {
      throw new Error('JWT verification key is not configured');
    }

    const [encodedHeader, encodedPayload, encodedSignature] = accessToken.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      throw new Error('Invalid token format');
    }

    const header = decodeJson<{ alg?: string; typ?: string }>(encodedHeader);
    if (header.alg !== 'RS256' || header.typ !== 'JWT') {
      throw new Error('Invalid token header');
    }

    const isValid = cryptoVerify(
      'RSA-SHA256',
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      createPublicKey(this.verificationKey),
      Buffer.from(encodedSignature, 'base64url'),
    );
    if (!isValid) {
      throw new Error('Invalid token signature');
    }

    const payload = decodeJson<VerifiedAccessToken>(encodedPayload);
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (payload.typ !== 'access' || !payload.sub || payload.exp <= nowSeconds) {
      throw new Error('Token expired');
    }

    return payload;
  }
}

function decodeJson<T>(value: string): T {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as T;
}

function normalizePem(value?: string): string {
  return value?.replace(/\\n/g, '\n').trim() ?? '';
}

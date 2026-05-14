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
  private readonly verificationKey: string;

  constructor(publicKey = process.env.USER_JWT_PUBLIC_KEY ?? process.env.JWT_PUBLIC_KEY) {
    if (!publicKey && process.env.NODE_ENV === 'production') {
      throw new Error('USER_JWT_PUBLIC_KEY or JWT_PUBLIC_KEY is required in production');
    }

    this.verificationKey = normalizePem(publicKey) || LOCAL_DEV_PRIVATE_KEY;
  }

  verify(accessToken: string, now = new Date()): VerifiedAccessToken {
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

const LOCAL_DEV_PRIVATE_KEY = `
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDVCBh5pTbg+fMR
Mhamt0oR5EtjTp6+wruVFhHvQg0yoQmJVMOpNvC2xO6WhQ2+6y7jNZgDK8YqX6O3
5THXfemly5pPKL9P+QM0L3Sg4a9oTl79yw8vS1mD7hbm16bYgBNoeQjaD0ueBR00
zPlL6bFfUC3j0c8gMx4FwPc74f0u5tYvaf65Izd0NcPV4NpCmTSl8Gf4Ia2qfV9z
6CpiVYfoXKBpq6F0svIwe7yJCjVJjOO0ELaIbgTxrwvjdrczU7s/nOb+RZntsNwP
R0Zh+WFa69f7Ir/ia+Q+Jf6KgdPf7M8vS20f5pLZk3ffJQW3pWw2EN6PZYuhDKca
uuvSmyCXAgMBAAECggEAEXEc5KtN+Jwr7g9a26FrnL25PpvP0U9kYI7taVWwR5Me
0jS+b4mEc4WHybAYllf8ZL9dESqkYgTVbaMrckXkPK7hJZoGqgpxCgTIQJaoZ4gA
vAV8qEaosqxxynIkmqX3YeIec9Y3jEaA6x+nXPTHlhFgZixLQ9VA89lAmnB2NhKt
VCH1J6vGKk9PmRlj7IR7mYPFOHvVB3XJXoL28fJ/z3TAuhvPGt8m7hzIhjP77cXQ
0HPSAw3zoCSNb2k+3PaYvRynwz9glAVWQRVv0zl/j0doOvj9AN42viJmVWEI/T9U
nF0A8mN4qr2dvJ6CA8GZ43SbsE6blm2W/f4H2+bxAQKBgQD1p21BWr4m1sC9pEzG
t4nN8j5UY9hufH/Ll2lMGVP1WqJIEk1qzYZX7PnJqVNisGAXV2tydsv5d3gK5Gus
q/5teww0scylHGYlQqCH8ZV68FYh2/PgXjcdPL4M/HTrvJjqD++J0QHPZZF6hI78
+QRyLhVwqK1FRHgEkbNQDnUhGQKBgQDeq5GKgCfoPQH2Op5v9a0B2/Y9fKETkBi9
qLoJzNTpcD3M1X6P9Q+MC6kFzcr4kmUfe9jRjBhEk7mI1jQoBqaGzWjj+M11gb7l
w1zV0YDQ6bapQlw5lVNyK7tBx+t1D+j8VuYCJnL9P7Bwxn0AjDUz45g4N75WimO7
hdqQxvkzTQKBgQC1HnHr7LDTyV0k/q1D0+l28FzYXh2dZVJ8qrMf54/Z1VJwzkE+
xL12j9mMgI3NqADw7QmDzc6hPUkGI0uawKj3+2QfoZHJ6QFrnmNuGrX7A3n+x0x1
b96m9IjuDsk7Yg2H4vUgVSBKovvq5Hc4/yJxL6U6lbvU/3J8QKr6mNFlAQKBgAe4
X69u6M7FKU2vNAAhqq1I7l/5E4T6xCZ+lp0fhwhGawyiE9uJ8NqB2YkjTQ2ehq9B
lg54Wdu2WzWqlfuVY4eb2VJ+H3cAGz/0cY97JJbADxw+HvW7eYEu6xOl5u5PRU+t
0S4DphNoH8roFKElWbYv/H46RNM4q6E+58f7S0WpAoGAUvjaSjsGoLG4QrHiM0CM
Hwos1vKJ8n8sX5D4JEDXazIh7dXvSP4w9vL5Za6rWrSFT1+BTZ+s1W7FduE+3Qh/
POnpJGqyr1vyElAnSoHgwPVA5h6wI0K4ra6I4B6jS1ACUrXm4jV16gF5tJQpeAVe
bh3KjX5Ekxly1HFQh5I5Wn8=
-----END PRIVATE KEY-----
`.trim();

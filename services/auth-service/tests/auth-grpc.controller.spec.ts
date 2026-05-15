import { create } from '@bufbuild/protobuf';
import {
  CompleteVkOAuthRequestSchema,
  GetUserRequestSchema,
  RefreshSessionRequestSchema,
  RevokeSessionRequestSchema,
} from '@findnmeet/ts-types/auth/v1';
import { AuthResult } from '@findnmeet/ts-types/auth/v1';
import { SensitiveStringSchema, UuidSchema } from '@findnmeet/ts-types/shared/v1';

import { AuthGrpcController } from '../src/interfaces/grpc/controllers/auth-grpc.controller';
import { CompleteVkOAuthUseCase } from '../src/auth/application/use-cases/complete-vk-oauth.use-case';
import { GetExternalLinksUseCase } from '../src/auth/application/use-cases/get-external-links.use-case';
import { GetUserUseCase } from '../src/auth/application/use-cases/get-user.use-case';
import { RefreshSessionUseCase } from '../src/auth/application/use-cases/refresh-session.use-case';
import { RevokeSessionUseCase } from '../src/auth/application/use-cases/revoke-session.use-case';
import { UserStatus } from '../src/auth/domain/models/user-status';
import { Provider } from '../src/auth/domain/models/provider';

describe('AuthGrpcController', () => {
  const now = new Date('2026-05-13T10:00:00.000Z');
  const completeVkOAuthUseCase = { execute: jest.fn() };
  const getUserUseCase = { execute: jest.fn() };
  const getExternalLinksUseCase = { execute: jest.fn() };
  const refreshSessionUseCase = { execute: jest.fn() };
  const revokeSessionUseCase = { execute: jest.fn() };
  const controller = new AuthGrpcController(
    completeVkOAuthUseCase as unknown as CompleteVkOAuthUseCase,
    getUserUseCase as unknown as GetUserUseCase,
    getExternalLinksUseCase as unknown as GetExternalLinksUseCase,
    refreshSessionUseCase as unknown as RefreshSessionUseCase,
    revokeSessionUseCase as unknown as RevokeSessionUseCase,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('completes VK OAuth and maps session/user to protobuf', async () => {
    completeVkOAuthUseCase.execute.mockResolvedValue({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        status: UserStatus.ACTIVE,
      },
      externalLinks: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          userId: '550e8400-e29b-41d4-a716-446655440000',
          provider: Provider.VK,
          externalId: '123',
          providerMeta: { screenName: 'ivan' },
          linkedAt: now,
          updatedAt: now,
        },
      ],
      session: {
        accessToken: 'access.jwt',
        refreshToken: 'refresh',
        expiresAt: now,
      },
      result: AuthResult.CREATED_USER,
    });

    const response = await controller.completeVkOAuth(
      create(CompleteVkOAuthRequestSchema, {
        code: 'oauth-code',
        state: 'state',
        redirectUri: 'http://localhost:3000/auth/vk/callback',
        codeVerifier: 'pkce-verifier',
      }),
    );

    expect(completeVkOAuthUseCase.execute).toHaveBeenCalledWith({
      code: 'oauth-code',
      state: 'state',
      redirectUri: 'http://localhost:3000/auth/vk/callback',
      codeVerifier: 'pkce-verifier',
    });
    expect(response.result).toBe(AuthResult.CREATED_USER);
    expect(response.user?.user?.id?.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(response.user?.externalLinks[0].providerMetadata.value?.screenName).toBe('ivan');
    expect(response.session?.accessToken?.value).toBe('access.jwt');
  });

  it('refreshes and revokes session by sensitive refresh token', async () => {
    refreshSessionUseCase.execute.mockResolvedValue({
      session: {
        accessToken: 'next-access.jwt',
        refreshToken: 'next-refresh',
        expiresAt: now,
      },
    });

    const refreshResponse = await controller.refreshSession(
      create(RefreshSessionRequestSchema, {
        refreshToken: create(SensitiveStringSchema, { value: 'refresh' }),
      }),
    );
    await controller.revokeSession(
      create(RevokeSessionRequestSchema, {
        refreshToken: create(SensitiveStringSchema, { value: 'next-refresh' }),
      }),
    );

    expect(refreshSessionUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'refresh' });
    expect(refreshResponse.session?.refreshToken?.value).toBe('next-refresh');
    expect(revokeSessionUseCase.execute).toHaveBeenCalledWith({ refreshToken: 'next-refresh' });
  });

  it('gets user by uuid wrapper', async () => {
    getUserUseCase.execute.mockResolvedValue({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: now,
        updatedAt: now,
        lastActiveAt: now,
        status: UserStatus.ACTIVE,
      },
      externalLinks: [],
    });

    await controller.getUser(create(GetUserRequestSchema, {
      userId: create(UuidSchema, { value: '550e8400-e29b-41d4-a716-446655440000' }),
    }));

    expect(getUserUseCase.execute).toHaveBeenCalledWith({ userId: '550e8400-e29b-41d4-a716-446655440000' });
  });
});

import { AuthResult } from '@findnmeet/ts-types/auth/v1';

import { CompleteVkWebAuthUseCase } from '../src/auth/application/use-cases/complete-vk-web-auth.use-case';
import { Provider } from '../src/auth/domain/models/provider';
import { UserStatus } from '../src/auth/domain/models/user-status';

describe('CompleteVkWebAuthUseCase', () => {
  const now = new Date('2026-05-24T10:00:00.000Z');

  const users = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const externalLinks = {
    findByProviderAndExternalId: jest.fn(),
    findByUserId: jest.fn(),
    save: jest.fn(),
  };
  const authSessions = {
    save: jest.fn(),
  };
  const authTokens = {
    findByExternalLinkId: jest.fn(),
    save: jest.fn(),
  };
  const unitOfWork = {
    runInTransaction: jest.fn(async (work: () => Promise<unknown>) => work()),
  };
  const sessionTokenManager = {
    issue: jest.fn(),
    hashRefreshToken: jest.fn(),
    refreshExpiresAt: jest.fn(),
  };
  const tokenCipher = {
    keyId: 'key-1',
  };
  const vkOAuthProvider = {
    getCurrentProfile: jest.fn(),
  };

  const useCase = new CompleteVkWebAuthUseCase(
    users as never,
    externalLinks as never,
    authSessions as never,
    authTokens as never,
    unitOfWork as never,
    sessionTokenManager as never,
    tokenCipher as never,
    vkOAuthProvider as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(now);

    users.findById.mockResolvedValue({
      id: 'user-1',
      createdAt: now,
      updatedAt: now,
      lastActiveAt: now,
      status: UserStatus.ACTIVE,
    });
    users.save.mockImplementation(async (user) => user);

    externalLinks.findByProviderAndExternalId.mockResolvedValue({
      id: 'vk-link-1',
      userId: 'user-1',
      provider: Provider.VK,
      externalId: '123',
      providerMeta: { screenName: 'ivan' },
      linkedAt: now,
      updatedAt: now,
    });
    externalLinks.findByUserId.mockResolvedValue([
      {
        id: 'vk-link-1',
        userId: 'user-1',
        provider: Provider.VK,
        externalId: '123',
        providerMeta: { screenName: 'ivan' },
        linkedAt: now,
        updatedAt: now,
      },
    ]);
    externalLinks.save.mockImplementation(async (link) => link);

    sessionTokenManager.issue.mockReturnValue({
      accessToken: 'fm-access',
      refreshToken: 'fm-refresh',
      expiresAt: now,
    });
    sessionTokenManager.hashRefreshToken.mockReturnValue('refresh-hash');
    sessionTokenManager.refreshExpiresAt.mockReturnValue(new Date(now.getTime() + 86_400_000));

    vkOAuthProvider.getCurrentProfile.mockResolvedValue({
      profile: {
        vkUserId: 123n,
        screenName: 'ivan',
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not persist VK API token when login is completed via VK web auth', async () => {
    const result = await useCase.execute({
      accessToken: 'vk2.a.identity-token',
      refreshToken: 'vk-refresh',
      expiresInSeconds: 3600,
      deviceId: 'device-1',
    });

    expect(result.result).toBe(AuthResult.AUTHENTICATED_EXISTING_USER);
    expect(authTokens.save).not.toHaveBeenCalled();
    expect(authTokens.findByExternalLinkId).not.toHaveBeenCalled();
  });
});

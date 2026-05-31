import { BadRequestException, Logger, UnauthorizedException } from '@nestjs/common';

import { GetVkAccessTokenUseCase } from '../src/auth/application/use-cases/get-vk-access-token.use-case';
import { Provider } from '../src/auth/domain/models/provider';

describe('GetVkAccessTokenUseCase', () => {
  const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  const externalLinks = {
    findByUserId: jest.fn(),
  };
  const authTokens = {
    findByExternalLinkId: jest.fn(),
  };
  const useCase = new GetVkAccessTokenUseCase(externalLinks as never, authTokens as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    warnSpy.mockRestore();
  });

  it('rejects missing user id', async () => {
    await expect(useCase.execute({ userId: '' })).rejects.toBeInstanceOf(BadRequestException);
    expect(externalLinks.findByUserId).not.toHaveBeenCalled();
  });

  it('rejects when VK account is not linked', async () => {
    externalLinks.findByUserId.mockResolvedValue([
      {
        id: 'link-1',
        provider: 999,
      },
    ]);

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toBeInstanceOf(UnauthorizedException);
    expect(authTokens.findByExternalLinkId).not.toHaveBeenCalled();
  });

  it('rejects when token is expired or revoked', async () => {
    externalLinks.findByUserId.mockResolvedValue([
      {
        id: 'vk-link-1',
        provider: Provider.VK,
      },
    ]);
    authTokens.findByExternalLinkId.mockResolvedValue({
      accessToken: 'vk-token',
      revokedAt: new Date('2026-05-22T10:00:00.000Z'),
      expiresAt: new Date('2026-05-22T11:00:00.000Z'),
    });

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns vk access token even when it has vk2 prefix', async () => {
    externalLinks.findByUserId.mockResolvedValue([
      {
        id: 'vk-link-1',
        provider: Provider.VK,
      },
    ]);
    authTokens.findByExternalLinkId.mockResolvedValue({
      accessToken: 'vk2.a.identity-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      accessToken: 'vk2.a.identity-token',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('returns vk access token for linked user', async () => {
    externalLinks.findByUserId.mockResolvedValue([
      {
        id: 'vk-link-1',
        provider: Provider.VK,
      },
    ]);
    authTokens.findByExternalLinkId.mockResolvedValue({
      accessToken: 'vk-token',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(useCase.execute({ userId: 'user-1' })).resolves.toEqual({
      accessToken: 'vk-token',
    });
    expect(authTokens.findByExternalLinkId).toHaveBeenCalledWith('vk-link-1');
  });
});

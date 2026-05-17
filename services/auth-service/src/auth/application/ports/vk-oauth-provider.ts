import type {
  ExchangeOAuthCodeRequest,
  ExchangeOAuthCodeResponse,
  GetCurrentProfileRequest,
  GetCurrentProfileResponse,
  RefreshOAuthTokensRequest,
  RefreshOAuthTokensResponse,
} from '@findnmeet/ts-types/vk/v1';

export abstract class VkOAuthProvider {
  abstract exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Promise<ExchangeOAuthCodeResponse>;
  abstract getCurrentProfile(request: GetCurrentProfileRequest): Promise<GetCurrentProfileResponse>;
  abstract refreshOAuthTokens(request: RefreshOAuthTokensRequest): Promise<RefreshOAuthTokensResponse>;
}

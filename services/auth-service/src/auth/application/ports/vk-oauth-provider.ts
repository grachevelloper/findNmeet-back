import type { ExchangeOAuthCodeRequest, ExchangeOAuthCodeResponse } from '@findnmeet/ts-types/vk/v1';

export abstract class VkOAuthProvider {
  abstract exchangeOAuthCode(request: ExchangeOAuthCodeRequest): Promise<ExchangeOAuthCodeResponse>;
}

import { AuthResult, type GetUserResponse, UserStatus } from '@findnmeet/ts-types/auth/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

export function authResultToHttp(value: AuthResult): string {
  switch (value) {
    case AuthResult.CREATED_USER:
      return 'created_user';
    case AuthResult.LINKED_EXISTING_USER:
      return 'linked_existing_user';
    case AuthResult.AUTHENTICATED_EXISTING_USER:
      return 'authenticated_existing_user';
    default:
      return 'unknown';
  }
}

export function userStatusToHttp(value?: UserStatus): string {
  switch (value) {
    case UserStatus.ACTIVE:
      return 'active';
    case UserStatus.DISABLED:
      return 'disabled';
    default:
      return 'unknown';
  }
}

export function mapUserResponse(response: GetUserResponse) {
  return {
    user: response.user
      ? {
          id: response.user.user?.id?.value ?? '',
          status: userStatusToHttp(response.user.user?.status),
          external_links: (response.user.externalLinks ?? []).map((link) => ({
            id: link.id?.value ?? '',
            provider: link.provider === Provider.VK ? 'VK' : 'UNSPECIFIED',
            external_id: link.externalId,
            screen_name: link.providerMetadata.case === 'vk' ? link.providerMetadata.value.screenName : undefined,
          })),
        }
      : undefined,
  };
}

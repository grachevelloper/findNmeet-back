import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';

import { protoTimestampToIsoString } from '../time/proto-timestamp';

export function mapFavoriteResponse(favorite?: Favorite) {
  if (!favorite) {
    return undefined;
  }

  const vkSnapshot = favorite.providerDetails.case === 'vkSnapshot' ? favorite.providerDetails.value : undefined;

  return {
    id: favorite.id?.value ?? '',
    provider: favorite.provider === Provider.VK ? 'VK' : 'UNSPECIFIED',
    external_id: favorite.externalId,
    display_title: favorite.displayTitle,
    display_image_url: favorite.displayImageUrl,
    note: favorite.note,
    added_at: protoTimestampToIsoString(favorite.addedAt),
    updated_at: protoTimestampToIsoString(favorite.updatedAt),
    vk_snapshot: vkSnapshot
      ? {
          vk_user_id: vkSnapshot.profile?.vkUserId?.toString() ?? '',
          first_name: vkSnapshot.profile?.firstName ?? '',
          last_name: vkSnapshot.profile?.lastName ?? '',
          screen_name: vkSnapshot.profile?.screenName ?? '',
          photo_url: vkSnapshot.profile?.photoUrl ?? '',
          snapshot_updated_at: protoTimestampToIsoString(vkSnapshot.snapshotUpdatedAt),
        }
      : undefined,
  };
}

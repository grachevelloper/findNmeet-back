import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { FavoriteSchema } from '@findnmeet/ts-types/favorites/v1';
import type { Favorite } from '@findnmeet/ts-types/favorites/v1';
import { Provider } from '@findnmeet/ts-types/shared/v1';
import type { Uuid } from '@findnmeet/ts-types/shared/v1';

import { createVkFavoriteSnapshot } from './vk-favorite-snapshot.factory';

export function createFavorite(input: {
  id: Uuid;
  provider: Provider;
  externalId: string;
  note: string;
  now: Date;
  addedAt?: Favorite['addedAt'];
}): Favorite {
  const snapshot = createVkFavoriteSnapshot(input.externalId, input.now);
  const profile = snapshot.profile!;
  const displayTitle = [profile.firstName, profile.lastName].filter(Boolean).join(' ');

  return create(FavoriteSchema, {
    id: input.id,
    provider: input.provider,
    externalId: input.externalId,
    displayTitle,
    displayImageUrl: profile.photoUrl,
    note: input.note,
    addedAt: input.addedAt ?? timestampFromDate(input.now),
    updatedAt: timestampFromDate(input.now),
    providerDetails: {
      case: 'vkSnapshot',
      value: snapshot,
    },
  });
}

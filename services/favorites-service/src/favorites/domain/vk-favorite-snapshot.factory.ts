import { create } from '@bufbuild/protobuf';
import { timestampFromDate } from '@bufbuild/protobuf/wkt';
import { VkFavoriteSnapshotSchema } from '@findnmeet/ts-types/favorites/v1';
import {
  VkOnlineStatus,
  VkPrivateMessageStatus,
  VkProfileSchema,
  VkProfileVisibility,
  VkRelationStatus,
} from '@findnmeet/ts-types/vk/v1';

export function createVkFavoriteSnapshot(externalId: string, now: Date) {
  return create(VkFavoriteSnapshotSchema, {
    profile: create(VkProfileSchema, {
      vkUserId: BigInt(externalId),
      firstName: 'VK',
      lastName: `User ${externalId}`,
      screenName: `id${externalId}`,
      photoUrl: '',
      onlineStatus: VkOnlineStatus.UNKNOWN,
      relation: VkRelationStatus.UNKNOWN,
      visibility: VkProfileVisibility.UNKNOWN,
      privateMessageStatus: VkPrivateMessageStatus.UNKNOWN,
    }),
    snapshotUpdatedAt: timestampFromDate(now),
  });
}

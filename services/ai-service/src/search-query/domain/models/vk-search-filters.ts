export interface VkSearchFilters {
  query: string;
  city?: VkReference;
  country?: VkReference;
  university?: VkReference;
  faculty?: VkReference;
  ageFrom?: number;
  ageTo?: number;
  graduationYear?: number;
  relation: VkRelationStatus;
  onlineOnly: boolean;
}

export interface VkReference {
  id: bigint;
  title: string;
}

export enum VkRelationStatus {
  VK_RELATION_STATUS_UNSPECIFIED = 0,
  VK_RELATION_STATUS_UNKNOWN = 1,
  VK_RELATION_STATUS_NOT_SPECIFIED = 2,
  VK_RELATION_STATUS_SINGLE = 3,
  VK_RELATION_STATUS_RELATIONSHIP = 4,
  VK_RELATION_STATUS_ENGAGED = 5,
  VK_RELATION_STATUS_MARRIED = 6,
  VK_RELATION_STATUS_COMPLICATED = 7,
  VK_RELATION_STATUS_SEARCHING = 8,
  VK_RELATION_STATUS_IN_LOVE = 9,
  VK_RELATION_STATUS_CIVIL_UNION = 10,
}

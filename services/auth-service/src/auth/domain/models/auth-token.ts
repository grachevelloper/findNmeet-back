export type AuthToken = {
  id: string;
  externalLinkId: string;
  accessToken: string;
  refreshToken: string;
  deviceId: string | null;
  encryptionKeyId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

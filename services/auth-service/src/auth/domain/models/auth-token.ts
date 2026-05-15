export type AuthToken = {
  id: string;
  externalLinkId: string;
  accessToken: string;
  refreshToken: string;
  encryptionKeyId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

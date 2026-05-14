import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_tokens' })
export class AuthTokenEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'external_link_id', unique: true })
  externalLinkId!: string;

  @Column('text', { name: 'access_token_ciphertext' })
  accessTokenCiphertext!: string;

  @Column('text', { name: 'refresh_token_ciphertext', default: '' })
  refreshTokenCiphertext!: string;

  @Column('varchar', { name: 'encryption_key_id', length: 64 })
  encryptionKeyId!: string;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamptz', { name: 'last_used_at', nullable: true })
  lastUsedAt!: Date | null;

  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;
}

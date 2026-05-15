import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'auth_sessions' })
@Index('auth_sessions_user_idx', ['userId'])
@Index('auth_sessions_refresh_hash_idx', ['refreshTokenHash'], { unique: true })
export class AuthSessionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('varchar', { name: 'refresh_token_hash', length: 128 })
  refreshTokenHash!: string;

  @Column('timestamptz', { name: 'expires_at' })
  expiresAt!: Date;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;

  @Column('timestamptz', { name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;
}

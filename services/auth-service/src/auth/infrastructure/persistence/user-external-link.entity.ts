import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'user_external_links' })
@Unique('user_external_links_provider_external_unique', ['provider', 'externalId'])
@Index('user_external_links_user_idx', ['userId'])
export class UserExternalLinkEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('integer')
  provider!: number;

  @Column('varchar', { name: 'external_id', length: 128 })
  externalId!: string;

  @Column('jsonb', { name: 'provider_meta', nullable: true })
  providerMeta!: Record<string, unknown> | null;

  @Column('timestamptz', { name: 'linked_at' })
  linkedAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;
}

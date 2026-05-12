import { Column, Entity, Index, PrimaryColumn, Unique } from 'typeorm';

@Entity({ name: 'favorites' })
@Unique('favorites_user_provider_external_unique', ['userId', 'provider', 'externalId'])
@Index('favorites_owner_added_at_idx', ['userId', 'addedAt'])
export class FavoriteEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('integer')
  provider!: number;

  @Column('varchar', { name: 'external_id', length: 128 })
  externalId!: string;

  @Column('varchar', { name: 'display_title', length: 255 })
  displayTitle!: string;

  @Column('text', { name: 'display_image_url', default: '' })
  displayImageUrl!: string;

  @Column('text', { default: '' })
  note!: string;

  @Column('timestamptz', { name: 'added_at' })
  addedAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;

  @Column('jsonb', { name: 'vk_snapshot', nullable: true })
  vkSnapshot!: Record<string, unknown> | null;
}

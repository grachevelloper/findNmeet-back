import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { ExternalLinkRepository } from '../../domain/ports/external-link.repository';
import type { UserExternalLink } from '../../domain/models/user-external-link';
import { UserExternalLinkEntity } from './user-external-link.entity';
import { TypeOrmManagerContext } from './typeorm-manager.context';
import { toDomainExternalLink, toExternalLinkEntity } from './mappers/auth-persistence.mapper';

@Injectable()
export class TypeOrmExternalLinkRepository extends ExternalLinkRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly managerContext: TypeOrmManagerContext,
  ) {
    super();
  }

  async findByProviderAndExternalId(provider: number, externalId: string): Promise<UserExternalLink | null> {
    const entity = await this.repository().findOneBy({ provider, externalId });
    return entity ? toDomainExternalLink(entity) : null;
  }

  async findByUserId(userId: string): Promise<UserExternalLink[]> {
    const entities = await this.repository().findBy({ userId });
    return entities.map(toDomainExternalLink);
  }

  async save(link: UserExternalLink): Promise<UserExternalLink> {
    const saved = await this.repository().save(toExternalLinkEntity(link));
    return toDomainExternalLink(saved);
  }

  private repository() {
    return this.managerContext.getRepository(this.dataSource, UserExternalLinkEntity);
  }
}

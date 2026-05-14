import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthSessionRepository } from '../../domain/ports/auth-session.repository';
import type { AuthSession } from '../../domain/models/auth-session';
import { AuthSessionEntity } from './auth-session.entity';
import { TypeOrmManagerContext } from './typeorm-manager.context';
import { toAuthSessionEntity, toDomainAuthSession } from './mappers/auth-persistence.mapper';

@Injectable()
export class TypeOrmAuthSessionRepository extends AuthSessionRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly managerContext: TypeOrmManagerContext,
  ) {
    super();
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const entity = await this.repository().findOneBy({ refreshTokenHash });
    return entity ? toDomainAuthSession(entity) : null;
  }

  async save(session: AuthSession): Promise<AuthSession> {
    const saved = await this.repository().save(toAuthSessionEntity(session));
    return toDomainAuthSession(saved);
  }

  private repository() {
    return this.managerContext.getRepository(this.dataSource, AuthSessionEntity);
  }
}

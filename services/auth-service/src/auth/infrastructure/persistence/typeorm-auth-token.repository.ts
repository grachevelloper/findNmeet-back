import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TokenCipher } from '../../application/ports/token-cipher';
import { AuthTokenRepository } from '../../domain/ports/auth-token.repository';
import type { AuthToken } from '../../domain/models/auth-token';
import { AuthTokenEntity } from './auth-token.entity';
import { TypeOrmManagerContext } from './typeorm-manager.context';
import { toAuthTokenEntity, toDomainAuthToken } from './mappers/auth-persistence.mapper';

@Injectable()
export class TypeOrmAuthTokenRepository extends AuthTokenRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly managerContext: TypeOrmManagerContext,
    private readonly tokenCipher: TokenCipher,
  ) {
    super();
  }

  async findByExternalLinkId(externalLinkId: string): Promise<AuthToken | null> {
    const entity = await this.repository().findOneBy({ externalLinkId });
    return entity ? toDomainAuthToken(entity, (value) => this.tokenCipher.decrypt(value)) : null;
  }

  async save(token: AuthToken): Promise<AuthToken> {
    const saved = await this.repository().save(toAuthTokenEntity(token, (value) => this.tokenCipher.encrypt(value)));
    return toDomainAuthToken(saved, (value) => this.tokenCipher.decrypt(value));
  }

  private repository() {
    return this.managerContext.getRepository(this.dataSource, AuthTokenEntity);
  }
}

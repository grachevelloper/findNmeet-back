import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { UserRepository } from '../../domain/ports/user.repository';
import type { User } from '../../domain/models/user';
import { UserEntity } from './user.entity';
import { TypeOrmManagerContext } from './typeorm-manager.context';
import { toDomainUser, toUserEntity } from './mappers/auth-persistence.mapper';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly managerContext: TypeOrmManagerContext,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository().findOneBy({ id });
    return entity ? toDomainUser(entity) : null;
  }

  async save(user: User): Promise<User> {
    const saved = await this.repository().save(toUserEntity(user));
    return toDomainUser(saved);
  }

  private repository() {
    return this.managerContext.getRepository(this.dataSource, UserEntity);
  }
}

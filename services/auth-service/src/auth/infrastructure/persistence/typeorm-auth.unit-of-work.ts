import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { AuthUnitOfWork } from '../../application/ports/auth-unit-of-work';
import { TypeOrmManagerContext } from './typeorm-manager.context';

@Injectable()
export class TypeOrmAuthUnitOfWork extends AuthUnitOfWork {
  constructor(
    private readonly dataSource: DataSource,
    private readonly managerContext: TypeOrmManagerContext,
  ) {
    super();
  }

  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.managerContext.runInTransaction(this.dataSource, work);
  }
}

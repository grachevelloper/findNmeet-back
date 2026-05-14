import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { DataSource, type EntityManager, type EntityTarget, type Repository } from 'typeorm';

@Injectable()
export class TypeOrmManagerContext {
  private readonly storage = new AsyncLocalStorage<EntityManager>();

  runInTransaction<T>(dataSource: DataSource, work: () => Promise<T>): Promise<T> {
    return dataSource.transaction((manager) => this.storage.run(manager, work));
  }

  getRepository<T extends object>(dataSource: DataSource, entity: EntityTarget<T>): Repository<T> {
    const manager = this.storage.getStore();
    return manager ? manager.getRepository(entity) : dataSource.getRepository(entity);
  }
}

export abstract class AuthUnitOfWork {
  abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

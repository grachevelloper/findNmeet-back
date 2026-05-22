import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { getPostgresSynchronize, getPostgresUrl } from '@findnmeet/utils';

import { AuthSessionEntity } from './auth/infrastructure/persistence/auth-session.entity';
import { AuthTokenEntity } from './auth/infrastructure/persistence/auth-token.entity';
import { UserExternalLinkEntity } from './auth/infrastructure/persistence/user-external-link.entity';
import { UserEntity } from './auth/infrastructure/persistence/user.entity';

export const authDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: getPostgresUrl(),
  entities: [UserEntity, UserExternalLinkEntity, AuthTokenEntity, AuthSessionEntity],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: getPostgresSynchronize(),
};

export default new DataSource(authDataSourceOptions);

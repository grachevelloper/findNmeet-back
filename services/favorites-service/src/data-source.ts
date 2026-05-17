import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import { getPostgresSynchronize, getPostgresUrl } from '@findnmeet/utils';

import { FavoriteEntity } from './favorites/infrastructure/persistence/favorite.entity';

export const favoritesDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: getPostgresUrl(),
  entities: [FavoriteEntity],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: getPostgresSynchronize(),
};

export default new DataSource(favoritesDataSourceOptions);

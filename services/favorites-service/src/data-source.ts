import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';

import { FavoriteEntity } from './favorites/infrastructure/persistence/favorite.entity';

export const favoritesDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: getPostgresUrl(),
  entities: [FavoriteEntity],
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
  synchronize: false,
};

export default new DataSource(favoritesDataSourceOptions);

function getPostgresUrl(): string {
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('POSTGRES_URL is required in production');
  }

  return 'postgresql://findnmeet:findnmeet@localhost:5432/findnmeet';
}

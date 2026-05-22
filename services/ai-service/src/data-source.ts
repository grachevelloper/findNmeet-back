import 'reflect-metadata';
import type { DataSourceOptions } from 'typeorm';
import { getPostgresUrl } from '@findnmeet/utils';


// export const favoritesDataSourceOptions: DataSourceOptions = {
//   type: 'postgres',
//   url: getPostgresUrl(),
//   entities: [FavoriteEntity],
//   migrations: [`${__dirname}/migrations/*{.ts,.js}`],
//   synchronize: getPostgresSynchronize(),
// };

// export default new DataSource(favoritesDataSourceOptions);

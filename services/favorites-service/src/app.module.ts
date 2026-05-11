import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { favoritesDataSourceOptions } from './data-source';
import { FavoritesModule } from './favorites/favorites.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [TypeOrmModule.forRoot(favoritesDataSourceOptions), FavoritesModule],
  controllers: [HealthController],
})
export class AppModule {}

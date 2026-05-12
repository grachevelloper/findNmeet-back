import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { favoritesDataSourceOptions } from './data-source';
import { FavoritesModule } from './favorites/favorites.module';
import { FavoritesGrpcController } from './grpc/controllers/favorites-grpc.controller';

@Module({
  imports: [TypeOrmModule.forRoot(favoritesDataSourceOptions), FavoritesModule],
  controllers: [FavoritesGrpcController],
})
export class AppModule {}

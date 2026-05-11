import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FavoriteEntity } from './favorite.entity';
import { FavoritesController } from './favorites.controller';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  controllers: [FavoritesController],
  providers: [FavoritesRepository, FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

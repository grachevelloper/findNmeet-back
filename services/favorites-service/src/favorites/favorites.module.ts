import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FavoriteEntity } from './favorite.entity';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesApplicationService } from './favorites.service';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  providers: [FavoritesRepository, FavoritesApplicationService],
  exports: [FavoritesApplicationService],
})
export class FavoritesModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FAVORITES_REPOSITORY } from './application/ports/favorites.repository';
import { FavoritesApplicationService } from './application/favorites.service';
import { FavoriteEntity } from './infrastructure/persistence/favorite.entity';
import { TypeOrmFavoritesRepository } from './infrastructure/persistence/typeorm-favorites.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  providers: [
    {
      provide: FAVORITES_REPOSITORY,
      useClass: TypeOrmFavoritesRepository,
    },
    FavoritesApplicationService,
  ],
  exports: [FavoritesApplicationService],
})
export class FavoritesModule {}

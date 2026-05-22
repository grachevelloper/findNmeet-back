import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CreateFavoriteUseCase } from './application/use-cases/create-favorite';
import { DeleteFavoriteUseCase } from './application/use-cases/delete-favorite';
import { GetFavoriteUseCase } from './application/use-cases/get-favorite';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites';
import { RefreshFavoriteUseCase } from './application/use-cases/refresh-favorite';
import { UpdateFavoriteUseCase } from './application/use-cases/update-favorite';
import { FavoritesRepository } from './domain/ports/favorites.repository';
import { FavoriteEntity } from './infrastructure/persistence/favorite.entity';
import { TypeOrmFavoritesRepository } from './infrastructure/persistence/typeorm-favorites.repository';

@Module({
  imports: [TypeOrmModule.forFeature([FavoriteEntity])],
  providers: [
    TypeOrmFavoritesRepository,
    CreateFavoriteUseCase,
    GetFavoriteUseCase,
    ListFavoritesUseCase,
    UpdateFavoriteUseCase,
    DeleteFavoriteUseCase,
    RefreshFavoriteUseCase,
    { provide: FavoritesRepository, useExisting: TypeOrmFavoritesRepository },
  ],
  exports: [
    CreateFavoriteUseCase,
    GetFavoriteUseCase,
    ListFavoritesUseCase,
    UpdateFavoriteUseCase,
    DeleteFavoriteUseCase,
    RefreshFavoriteUseCase,
  ],
})
export class FavoritesModule {}

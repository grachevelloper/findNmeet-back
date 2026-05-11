import { Module } from '@nestjs/common';

import { FavoritesController } from './favorites.controller';
import { FavoritesRepository } from './favorites.repository';
import { FavoritesService } from './favorites.service';

@Module({
  controllers: [FavoritesController],
  providers: [FavoritesRepository, FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}

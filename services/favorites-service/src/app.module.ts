import { Module } from '@nestjs/common';

import { FavoritesModule } from './favorites/favorites.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [FavoritesModule],
  controllers: [HealthController],
})
export class AppModule {}

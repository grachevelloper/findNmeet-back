import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// import { favoritesDataSourceOptions } from './data-source';

@Module({
  imports: [
    // TypeOrmModule.forRoot(favoritesDataSourceOptions), 
    // FavoritesModule
],
  controllers: [],
})
export class AppModule {}

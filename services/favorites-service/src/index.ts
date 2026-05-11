import 'reflect-metadata';
import { expressConnectMiddleware } from '@connectrpc/connect-express';
import { createValidateInterceptor } from '@connectrpc/validate';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createFavoritesConnectRoutes } from './favorites/favorites.connect';
import { FavoritesApplicationService } from './favorites/favorites.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const favoritesService = app.get(FavoritesApplicationService);

  app.use(
    expressConnectMiddleware({
      interceptors: [createValidateInterceptor()],
      routes: createFavoritesConnectRoutes(favoritesService),
    }),
  );

  const port = process.env.FAVORITES_SERVICE_PORT ?? 3003;
  await app.listen(port);
  console.log(`favorites-service running on port ${port}`);
}

bootstrap();

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.FAVORITES_SERVICE_PORT ?? 3003;
  await app.listen(port);
  console.log(`favorites-service running on port ${port}`);
}

bootstrap();

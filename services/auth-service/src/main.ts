import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.AUTH_SERVICE_PORT ?? 3001;
  await app.listen(port);
  console.log(`auth-service running on port ${port}`);
}

bootstrap();

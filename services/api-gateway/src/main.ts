import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { corsOptions } from './config/cors.options';
import { httpsOptions } from './config/https.options';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    httpsOptions: httpsOptions(),
  });

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors(corsOptions());

  const port = Number(process.env.API_GATEWAY_PORT ?? 3000);
  const host = process.env.API_GATEWAY_HOST ?? '127.0.0.1';
  await app.listen(port, host);

  const logger = new Logger('ApiGatewayBootstrap');
  logger.log(`api-gateway listening on ${host}:${port}`);
}

void bootstrap();

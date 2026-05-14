import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { authDataSourceOptions } from './data-source';
import { AuthGrpcController } from './interfaces/grpc/controllers/auth-grpc.controller';

@Module({
  imports: [TypeOrmModule.forRoot(authDataSourceOptions), AuthModule],
  controllers: [AuthGrpcController],
})
export class AppModule {}

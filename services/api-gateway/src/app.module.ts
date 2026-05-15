import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [AuthModule, ProxyModule],
  controllers: [HealthController],
})
export class AppModule {}

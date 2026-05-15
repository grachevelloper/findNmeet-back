import { Module } from '@nestjs/common';

import { AccessTokenVerifier } from './access-token-verifier';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalAuthGuard } from './optional-auth.guard';

@Module({
  providers: [AccessTokenVerifier, JwtAuthGuard, OptionalAuthGuard],
  exports: [AccessTokenVerifier, JwtAuthGuard, OptionalAuthGuard],
})
export class AuthModule {}

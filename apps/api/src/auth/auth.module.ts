import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth.guard.js';
import { AuthService } from './auth.service.js';
import { OpsAuthService } from './ops-auth.service.js';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, OpsAuthService, { provide: APP_GUARD, useClass: AuthGuard }],
  exports: [AuthService, OpsAuthService],
})
export class AuthModule {}

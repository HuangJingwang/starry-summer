import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';
import { ReaderAuthGuard } from './reader-auth.guard.js';
import { SecurityModule } from '../security/security.module.js';

@Module({
  imports: [SecurityModule],
  controllers: [AuthController],
  providers: [AdminAuthGuard, AuthService, LoginRateLimitGuard, ReaderAuthGuard],
  exports: [AdminAuthGuard, AuthService, ReaderAuthGuard],
})
export class AuthModule {}

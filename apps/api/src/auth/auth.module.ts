import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';
import { LoginRateLimitGuard } from './login-rate-limit.guard.js';
import { SecurityModule } from '../security/security.module.js';

@Module({
  imports: [SecurityModule],
  controllers: [AuthController],
  providers: [AdminAuthGuard, AuthService, LoginRateLimitGuard],
  exports: [AdminAuthGuard, AuthService],
})
export class AuthModule {}

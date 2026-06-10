import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AdminAuthGuard } from './admin-auth.guard.js';

@Module({
  controllers: [AuthController],
  providers: [AdminAuthGuard, AuthService],
  exports: [AdminAuthGuard, AuthService],
})
export class AuthModule {}

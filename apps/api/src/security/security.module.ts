import { Module } from '@nestjs/common';

import { PublicInteractionRateLimitGuard } from './public-interaction-rate-limit.guard.js';
import { RateLimitService } from './rate-limit.service.js';

@Module({
  providers: [PublicInteractionRateLimitGuard, RateLimitService],
  exports: [PublicInteractionRateLimitGuard, RateLimitService],
})
export class SecurityModule {}

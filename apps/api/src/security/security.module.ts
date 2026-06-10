import { Module } from '@nestjs/common';

import { PublicInteractionRateLimitGuard } from './public-interaction-rate-limit.guard.js';
import { createRateLimitServiceFromEnv, RateLimitService } from './rate-limit.service.js';

@Module({
  providers: [
    PublicInteractionRateLimitGuard,
    {
      provide: RateLimitService,
      useFactory: createRateLimitServiceFromEnv,
    },
  ],
  exports: [PublicInteractionRateLimitGuard, RateLimitService],
})
export class SecurityModule {}

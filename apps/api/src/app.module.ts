import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { ContentModule } from './content/content.module.js';
import { HealthController } from './health/health.controller.js';
import { InteractionsModule } from './interactions/interactions.module.js';

@Module({
  imports: [AuthModule, ContentModule, InteractionsModule],
  controllers: [HealthController],
})
export class AppModule {}

import { Module } from '@nestjs/common';

import { ContentModule } from './content/content.module.js';
import { HealthController } from './health/health.controller.js';
import { InteractionsModule } from './interactions/interactions.module.js';

@Module({
  imports: [ContentModule, InteractionsModule],
  controllers: [HealthController],
})
export class AppModule {}

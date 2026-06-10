import { Module } from '@nestjs/common';

import { AssetsModule } from './assets/assets.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ContentModule } from './content/content.module.js';
import { HealthController } from './health/health.controller.js';
import { HealthService } from './health/health.service.js';
import { InteractionsModule } from './interactions/interactions.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { TaxonomyModule } from './taxonomy/taxonomy.module.js';

@Module({
  imports: [AssetsModule, AuthModule, ContentModule, InteractionsModule, SettingsModule, TaxonomyModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class AppModule {}

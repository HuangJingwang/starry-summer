import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { PostgresSettingsRepository } from './postgres-settings.repository.js';
import { InMemorySettingsRepository, SETTINGS_REPOSITORY, type SettingsRepository } from './settings.repository.js';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';

function createSettingsRepository(): SettingsRepository {
  if (process.env.CONTENT_REPOSITORY_DRIVER === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres');
    }

    return new PostgresSettingsRepository(databaseUrl);
  }

  return new InMemorySettingsRepository();
}

@Module({
  imports: [AuthModule],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useFactory: createSettingsRepository,
    },
  ],
  exports: [SettingsService],
})
export class SettingsModule {}

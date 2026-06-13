import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { createDemoContentRecords } from '../demo/demo-data.js';
import { AdminContentController } from './admin-content.controller.js';
import { ContentController } from './content.controller.js';
import { CONTENT_REPOSITORY, InMemoryContentRepository, type ContentRepository } from './content.repository.js';
import { ContentService } from './content.service.js';
import { PostgresContentRepository } from './postgres-content.repository.js';

function createContentRepository(): ContentRepository {
  if (process.env.CONTENT_REPOSITORY_DRIVER === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres');
    }

    return new PostgresContentRepository(databaseUrl);
  }

  return new InMemoryContentRepository(undefined, createDemoContentRecords());
}

@Module({
  imports: [AuthModule],
  controllers: [AdminContentController, ContentController],
  providers: [
    ContentService,
    {
      provide: CONTENT_REPOSITORY,
      useFactory: createContentRepository,
    },
  ],
  exports: [ContentService],
})
export class ContentModule {}

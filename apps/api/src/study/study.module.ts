import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ContentModule } from '../content/content.module.js';
import { AdminStudyController, StudyController } from './study.controller.js';
import { InMemoryStudyRepository, STUDY_REPOSITORY, type StudyRepository } from './study.repository.js';
import { PostgresStudyRepository } from './postgres-study.repository.js';
import { StudyService } from './study.service.js';

function createStudyRepository(): StudyRepository {
  if (process.env.STUDY_REPOSITORY_DRIVER === 'postgres' || process.env.CONTENT_REPOSITORY_DRIVER === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when study repository uses postgres');
    }

    return new PostgresStudyRepository(databaseUrl);
  }

  return new InMemoryStudyRepository();
}

@Module({
  imports: [AuthModule, ContentModule],
  controllers: [StudyController, AdminStudyController],
  providers: [
    StudyService,
    {
      provide: STUDY_REPOSITORY,
      useFactory: createStudyRepository,
    },
  ],
})
export class StudyModule {}

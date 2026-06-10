import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { SecurityModule } from '../security/security.module.js';
import { InteractionsController } from './interactions.controller.js';
import {
  InMemoryInteractionsRepository,
  INTERACTIONS_REPOSITORY,
  type InteractionsRepository,
} from './interactions.repository.js';
import { InteractionsService } from './interactions.service.js';
import { PostgresInteractionsRepository } from './postgres-interactions.repository.js';

function createInteractionsRepository(): InteractionsRepository {
  if (process.env.CONTENT_REPOSITORY_DRIVER === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres');
    }

    return new PostgresInteractionsRepository(databaseUrl);
  }

  return new InMemoryInteractionsRepository();
}

@Module({
  imports: [AuthModule, SecurityModule],
  controllers: [InteractionsController],
  providers: [
    InteractionsService,
    {
      provide: INTERACTIONS_REPOSITORY,
      useFactory: createInteractionsRepository,
    },
  ],
})
export class InteractionsModule {}

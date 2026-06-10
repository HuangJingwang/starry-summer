import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { InMemoryTaxonomyRepository, TAXONOMY_REPOSITORY, type TaxonomyRepository } from './taxonomy.repository.js';
import { PostgresTaxonomyRepository } from './postgres-taxonomy.repository.js';
import { TaxonomyController } from './taxonomy.controller.js';
import { TaxonomyService } from './taxonomy.service.js';

function createTaxonomyRepository(): TaxonomyRepository {
  if (process.env.CONTENT_REPOSITORY_DRIVER === 'postgres') {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when CONTENT_REPOSITORY_DRIVER=postgres');
    }

    return new PostgresTaxonomyRepository(databaseUrl);
  }

  return new InMemoryTaxonomyRepository();
}

@Module({
  imports: [AuthModule],
  controllers: [TaxonomyController],
  providers: [
    TaxonomyService,
    {
      provide: TAXONOMY_REPOSITORY,
      useFactory: createTaxonomyRepository,
    },
  ],
  exports: [TaxonomyService],
})
export class TaxonomyModule {}

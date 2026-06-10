import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { TaxonomyService, type CreateTaxonomyInput, type UpdateTaxonomyInput } from './taxonomy.service.js';
import type { TaxonomyType } from './taxonomy.repository.js';

@Controller('admin/taxonomy/:type')
@UseGuards(AdminAuthGuard)
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  list(@Param('type') type: TaxonomyType) {
    return this.taxonomyService.listTerms(type);
  }

  @Post()
  create(@Param('type') type: TaxonomyType, @Body() input: CreateTaxonomyInput) {
    return this.taxonomyService.createTerm(type, input);
  }

  @Patch(':id')
  update(@Param('type') type: TaxonomyType, @Param('id') id: string, @Body() input: UpdateTaxonomyInput) {
    return this.taxonomyService.updateTerm(type, id, input);
  }

  @Delete(':id')
  delete(@Param('type') type: TaxonomyType, @Param('id') id: string) {
    return this.taxonomyService.deleteTerm(type, id);
  }
}

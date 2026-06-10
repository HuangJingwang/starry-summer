import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import type { ContentVisibility } from '@starry-summer/shared';

import { ContentService, type CreateDraftInput } from './content.service.js';

@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  listAdmin() {
    return this.contentService.listAdmin();
  }

  @Post()
  createDraft(@Body() input: CreateDraftInput) {
    return this.contentService.createDraft(input);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }

  @Patch(':id/visibility')
  setVisibility(@Param('id') id: string, @Body('visibility') visibility: ContentVisibility) {
    return this.contentService.setVisibility(id, visibility);
  }
}

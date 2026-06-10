import { Body, Controller, Get, Header, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { ContentVisibility } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { ContentService, type CreateDraftInput, type UpdateContentInput } from './content.service.js';

@Controller('admin/content')
@UseGuards(AdminAuthGuard)
export class AdminContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get()
  listAdmin() {
    return this.contentService.listAdmin();
  }

  @Get('export/all')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="starry-summer-export-all.md"')
  exportMarkdownArchive() {
    return this.contentService.exportMarkdownArchive();
  }

  @Get(':id')
  getAdminRecord(@Param('id') id: string) {
    return this.contentService.getAdminRecord(id);
  }

  @Post()
  createDraft(@Body() input: CreateDraftInput) {
    return this.contentService.createDraft(input);
  }

  @Patch(':id')
  updateContent(@Param('id') id: string, @Body() input: UpdateContentInput) {
    return this.contentService.updateContent(id, input);
  }

  @Patch(':id/publish')
  publish(@Param('id') id: string) {
    return this.contentService.publish(id);
  }

  @Patch(':id/archive')
  archive(@Param('id') id: string) {
    return this.contentService.archive(id);
  }

  @Patch(':id/restore-draft')
  restoreDraft(@Param('id') id: string) {
    return this.contentService.restoreDraft(id);
  }

  @Patch(':id/visibility')
  setVisibility(@Param('id') id: string, @Body('visibility') visibility: ContentVisibility) {
    return this.contentService.setVisibility(id, visibility);
  }

  @Post('import')
  importMarkdown(@Body('markdown') markdown: string, @Body('type') type: CreateDraftInput['type']) {
    return this.contentService.importMarkdown(markdown, type);
  }

  @Get(':id/export')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="starry-summer-export.md"')
  exportMarkdown(@Param('id') id: string) {
    return this.contentService.exportMarkdown(id);
  }
}

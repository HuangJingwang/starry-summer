import { BadRequestException, Body, Controller, Delete, Get, Header, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { ContentStatus, ContentType, ContentVisibility } from '@starry-summer/shared';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { ContentService, type CreateDraftInput, type UpdateContentInput } from './content.service.js';

@Controller('admin/content')
@UseGuards(AdminAuthGuard)
export class AdminContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get()
  listAdmin(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('q') query?: string,
    @Query('category') category?: string,
    @Query('tag') tag?: string,
  ) {
    return this.contentService.listAdmin({
      type: parseOptionalContentType(type),
      status: parseOptionalContentStatus(status),
      query: normalizeOptionalQuery(query),
      category: normalizeOptionalQuery(category),
      tag: normalizeOptionalQuery(tag),
    });
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

  @Delete(':id')
  deleteArchived(@Param('id') id: string) {
    return this.contentService.deleteArchived(id);
  }

  @Patch(':id/visibility')
  setVisibility(@Param('id') id: string, @Body('visibility') visibility: ContentVisibility) {
    return this.contentService.setVisibility(id, visibility);
  }

  @Post('import')
  importMarkdown(@Body('markdown') markdown: string, @Body('type') type: CreateDraftInput['type']) {
    return this.contentService.importMarkdown(markdown, type);
  }

  @Post('import/archive')
  importMarkdownArchive(@Body('markdown') markdown: string) {
    return this.contentService.importMarkdownArchive(markdown);
  }

  @Get(':id/export')
  @Header('Content-Type', 'text/markdown; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="starry-summer-export.md"')
  exportMarkdown(@Param('id') id: string) {
    return this.contentService.exportMarkdown(id);
  }
}

const contentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);
const contentStatuses = new Set<ContentStatus>(['draft', 'published', 'private', 'archived']);

function parseOptionalContentType(value: string | undefined): ContentType | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (!contentTypes.has(value as ContentType)) {
    throw new BadRequestException(`Unsupported content type: ${value}`);
  }

  return value as ContentType;
}

function parseOptionalContentStatus(value: string | undefined): ContentStatus | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (!contentStatuses.has(value as ContentStatus)) {
    throw new BadRequestException(`Unsupported content status: ${value}`);
  }

  return value as ContentStatus;
}

function normalizeOptionalQuery(value: string | undefined): string | undefined {
  const query = value?.trim();
  return query === '' ? undefined : query;
}

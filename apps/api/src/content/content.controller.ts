import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import type { ContentType } from '@starry-summer/shared';

import { ContentService, type PublicContentSort } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get()
  listPublic(@Query('type') type?: string, @Query('sort') sort?: string, @Query('q') query?: string) {
    return this.contentService.listPublic({
      type: parseOptionalContentType(type),
      sort: parseOptionalPublicSort(sort),
      query: normalizeOptionalQuery(query),
    });
  }
}

const contentTypes = new Set<ContentType>(['post', 'note', 'moment', 'page', 'project']);
const publicContentSorts = new Set<PublicContentSort>(['latest', 'popular']);

function parseOptionalContentType(value: string | undefined): ContentType | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (!contentTypes.has(value as ContentType)) {
    throw new BadRequestException(`Unsupported content type: ${value}`);
  }

  return value as ContentType;
}

function parseOptionalPublicSort(value: string | undefined): PublicContentSort | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  if (!publicContentSorts.has(value as PublicContentSort)) {
    throw new BadRequestException(`Unsupported content sort: ${value}`);
  }

  return value as PublicContentSort;
}

function normalizeOptionalQuery(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  return normalized || undefined;
}

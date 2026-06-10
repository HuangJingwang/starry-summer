import { Controller, Get, Inject, Query } from '@nestjs/common';
import type { ContentType } from '@starry-summer/shared';

import { ContentService, type PublicContentSort } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(@Inject(ContentService) private readonly contentService: ContentService) {}

  @Get()
  listPublic(@Query('type') type?: ContentType, @Query('sort') sort?: PublicContentSort) {
    return this.contentService.listPublic({ type, sort });
  }
}

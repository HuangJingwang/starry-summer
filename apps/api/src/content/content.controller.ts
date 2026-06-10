import { Controller, Get, Query } from '@nestjs/common';
import type { ContentType } from '@starry-summer/shared';

import { ContentService } from './content.service.js';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  listPublic(@Query('type') type?: ContentType) {
    return this.contentService.listPublic({ type });
  }
}

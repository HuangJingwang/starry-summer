import { Module } from '@nestjs/common';

import { AdminContentController } from './admin-content.controller.js';
import { ContentController } from './content.controller.js';
import { ContentService } from './content.service.js';

@Module({
  controllers: [AdminContentController, ContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}

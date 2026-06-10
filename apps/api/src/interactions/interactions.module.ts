import { Module } from '@nestjs/common';

import { SecurityModule } from '../security/security.module.js';
import { InteractionsController } from './interactions.controller.js';
import { InteractionsService } from './interactions.service.js';

@Module({
  imports: [SecurityModule],
  controllers: [InteractionsController],
  providers: [InteractionsService],
})
export class InteractionsModule {}

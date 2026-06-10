import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { AssetsService, type UploadAssetInput } from './assets.service.js';

@Controller('admin/assets')
@UseGuards(AdminAuthGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post()
  upload(@Body() input: UploadAssetInput) {
    return this.assetsService.upload(input);
  }
}

import { Body, Controller, Delete, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard.js';
import { AssetsService, type UploadAssetInput } from './assets.service.js';
import { normalizeAssetUsage, type AssetUsage } from './assets.repository.js';

@Controller('admin/assets')
@UseGuards(AdminAuthGuard)
export class AssetsController {
  constructor(@Inject(AssetsService) private readonly assetsService: AssetsService) {}

  @Post()
  upload(@Body() input: UploadAssetInput) {
    return this.assetsService.upload(input);
  }

  @Get()
  listAdmin(@Query('usage') usage?: AssetUsage) {
    return this.assetsService.list(usage ? { usage: normalizeAssetUsage(usage) } : {});
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.assetsService.delete(id);
  }
}

@Controller('assets')
export class PublicAssetsController {
  constructor(@Inject(AssetsService) private readonly assetsService: AssetsService) {}

  @Get()
  list(@Query('usage') usage?: AssetUsage) {
    return this.assetsService.list({ usage: usage ? normalizeAssetUsage(usage) : 'background' });
  }

  @Get('random')
  random(@Query('usage') usage?: AssetUsage) {
    return this.assetsService.random({ usage: usage ? normalizeAssetUsage(usage) : 'background' });
  }
}

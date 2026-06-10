import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ASSET_REPOSITORY } from './assets.repository.js';
import { ASSET_STORAGE, AssetsService, createAssetRepository, createAssetStorage } from './assets.service.js';
import { AssetsController, PublicAssetsController } from './assets.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AssetsController, PublicAssetsController],
  providers: [
    AssetsService,
    {
      provide: ASSET_STORAGE,
      useFactory: createAssetStorage,
    },
    {
      provide: ASSET_REPOSITORY,
      useFactory: createAssetRepository,
    },
  ],
  exports: [AssetsService],
})
export class AssetsModule {}

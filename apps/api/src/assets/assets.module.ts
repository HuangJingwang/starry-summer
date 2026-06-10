import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ASSET_STORAGE, AssetsService, createAssetStorage } from './assets.service.js';
import { AssetsController } from './assets.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AssetsController],
  providers: [
    AssetsService,
    {
      provide: ASSET_STORAGE,
      useFactory: createAssetStorage,
    },
  ],
  exports: [AssetsService],
})
export class AssetsModule {}

import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';
import { describe, expect, test } from 'vitest';

import { AssetsController, PublicAssetsController } from './assets.controller';
import { AssetsService } from './assets.service';

describe('Assets controllers', () => {
  test('declare assets service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, AssetsController)).toEqual([
      { index: 0, param: AssetsService },
    ]);
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, PublicAssetsController)).toEqual([
      { index: 0, param: AssetsService },
    ]);
  });
});

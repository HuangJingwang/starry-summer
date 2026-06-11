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

  test('public controller exposes background assets for the home hero rotation', async () => {
    const service = {
      list: async (filter: unknown) => [{ id: 'asset-1', filter }],
    };
    const controller = new PublicAssetsController(service as unknown as AssetsService);

    await expect(controller.list()).resolves.toEqual([{ id: 'asset-1', filter: { usage: 'background' } }]);
  });

  test('public random asset defaults to background assets', async () => {
    const service = {
      random: async (filter: unknown) => ({ filter }),
    };
    const controller = new PublicAssetsController(service as unknown as AssetsService);

    await expect(controller.random()).resolves.toEqual({
      filter: { usage: 'background' },
    });
  });

  test('public random asset accepts a usage query parameter', async () => {
    const service = {
      random: async (filter: unknown) => ({ filter }),
    };
    const controller = new PublicAssetsController(service as unknown as AssetsService);

    await expect(controller.random('cover')).resolves.toEqual({
      filter: { usage: 'cover' },
    });
  });

  test('public random asset normalizes unsupported usage parameters', async () => {
    const service = {
      random: async (filter: unknown) => ({ filter }),
    };
    const controller = new PublicAssetsController(service as unknown as AssetsService);

    await expect(controller.random('bad-usage' as never)).resolves.toEqual({
      filter: { usage: 'content' },
    });
  });
});

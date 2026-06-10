import { describe, expect, test } from 'vitest';
import { SELF_DECLARED_DEPS_METADATA } from '@nestjs/common/constants';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  test('declares health service injection explicitly for runtime bootstrap', () => {
    expect(Reflect.getMetadata(SELF_DECLARED_DEPS_METADATA, HealthController)).toEqual([
      { index: 0, param: HealthService },
    ]);
  });

  test('returns the health service report', async () => {
    const controller = new HealthController(
      new HealthService({
        repositoryDriver: 'memory',
      }),
    );

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
      },
    });
  });
});

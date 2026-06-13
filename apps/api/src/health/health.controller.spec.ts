import { describe, expect, test, vi } from 'vitest';
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
    const response = { status: vi.fn() };

    await expect(controller.check(response as never)).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-api',
      release: {
        version: 'development',
        revision: 'unknown',
      },
      components: {
        api: { status: 'ok' },
        database: {
          status: 'skipped',
          driver: 'memory',
        },
      },
    });
    expect(response.status).toHaveBeenCalledWith(200);
  });

  test('sets HTTP 503 for degraded deployment health reports', async () => {
    const controller = new HealthController({
      check: async () => ({
        status: 'degraded',
        service: 'starry-summer-api',
        release: {
          version: 'development',
          revision: 'unknown',
        },
        components: {
          api: { status: 'ok' },
          database: {
            status: 'error',
            driver: 'postgres',
            message: 'connection refused',
          },
        },
      }),
    } as HealthService);
    const response = { status: vi.fn() };

    await expect(controller.check(response as never)).resolves.toMatchObject({
      status: 'degraded',
      components: {
        database: {
          status: 'error',
        },
      },
    });
    expect(response.status).toHaveBeenCalledWith(503);
  });
});

import { describe, expect, test } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  test('returns ok status and service name', () => {
    const controller = new HealthController();

    expect(controller.check()).toEqual({
      status: 'ok',
      service: 'starry-summer-api',
    });
  });
});

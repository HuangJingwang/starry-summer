import { afterEach, describe, expect, test, vi } from 'vitest';

import { GET } from './route';

describe('web health route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('returns an ok status for deployment health checks', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-web',
      release: {
        version: 'development',
        revision: 'unknown',
      },
    });
  });

  test('includes release metadata from the deployment environment', async () => {
    vi.stubEnv('RELEASE_VERSION', '2026.06.11');
    vi.stubEnv('GIT_REVISION', 'abc1234');

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      release: {
        version: '2026.06.11',
        revision: 'abc1234',
      },
    });
  });
});

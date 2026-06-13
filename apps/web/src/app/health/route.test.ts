import { afterEach, describe, expect, test, vi } from 'vitest';

import { GET } from './route';

describe('web health route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
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

  test('returns HTTP 503 when the configured API health check is degraded', async () => {
    vi.stubEnv('API_BASE_URL', 'https://api.example.com');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json(
          {
            status: 'degraded',
            service: 'starry-summer-api',
            components: {
              database: {
                status: 'error',
                driver: 'postgres',
              },
            },
          },
          { status: 503 },
        ),
      ),
    );

    const response = await GET();

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/health', { cache: 'no-store' });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: 'degraded',
      service: 'starry-summer-web',
      components: {
        api: {
          status: 'degraded',
          upstreamStatus: 503,
        },
      },
    });
  });
});

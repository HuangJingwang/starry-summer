import { describe, expect, test } from 'vitest';

import { GET } from './route';

describe('web health route', () => {
  test('returns an ok status for deployment health checks', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: 'ok',
      service: 'starry-summer-web',
    });
  });
});

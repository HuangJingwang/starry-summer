import { describe, expect, test } from 'vitest';

import { buildAssetUploadPayload, buildAssetUploadRequest, normalizeStoredAsset } from './assets';

describe('asset client helpers', () => {
  test('builds an upload payload from a browser file', async () => {
    const file = new File(['hello'], 'Hello Image.PNG', { type: 'image/png' });

    await expect(buildAssetUploadPayload(file)).resolves.toEqual({
      filename: 'Hello Image.PNG',
      mimeType: 'image/png',
      base64: 'aGVsbG8=',
    });
  });

  test('builds an authenticated asset upload request', () => {
    expect(
      buildAssetUploadRequest({
        filename: 'cover.png',
        mimeType: 'image/png',
        base64: 'aGVsbG8=',
        usage: 'cover',
        altText: 'Cover image',
      }),
    ).toEqual({
      url: '/api/admin/assets',
      init: {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          filename: 'cover.png',
          mimeType: 'image/png',
          base64: 'aGVsbG8=',
          usage: 'cover',
          altText: 'Cover image',
        }),
      },
    });
  });

  test('builds gallery list and random image requests', async () => {
    const { buildAssetListRequest, buildRandomAssetRequest } = await import('./assets');

    expect(buildAssetListRequest({ usage: 'background' }).url).toBe('/api/assets?usage=background');
    expect(buildRandomAssetRequest({ usage: 'background' }).url).toBe('/api/assets/random?usage=background');
  });

  test('normalizes stored asset API data', () => {
    expect(
      normalizeStoredAsset({
        storageKey: '2026/06/10/cover.png',
        publicUrl: '/uploads/2026/06/10/cover.png',
        mimeType: 'image/png',
        byteSize: 5,
        usage: 'cover',
        altText: 'Cover image',
        createdAt: '2026-06-10T00:00:00.000Z',
      }),
    ).toEqual({
      id: '',
      storageKey: '2026/06/10/cover.png',
      publicUrl: '/uploads/2026/06/10/cover.png',
      mimeType: 'image/png',
      byteSize: 5,
      usage: 'cover',
      altText: 'Cover image',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });
});

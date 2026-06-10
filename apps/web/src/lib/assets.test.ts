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
        }),
      },
    });
  });

  test('normalizes stored asset API data', () => {
    expect(
      normalizeStoredAsset({
        storageKey: '2026/06/10/cover.png',
        publicUrl: '/uploads/2026/06/10/cover.png',
        mimeType: 'image/png',
        byteSize: 5,
      }),
    ).toEqual({
      storageKey: '2026/06/10/cover.png',
      publicUrl: '/uploads/2026/06/10/cover.png',
      mimeType: 'image/png',
      byteSize: 5,
    });
  });
});

import { describe, expect, test } from 'vitest';

import {
  buildAssetDeleteRequest,
  buildAssetUploadPayload,
  buildAssetUploadRequest,
  buildMarkdownAssetEmbed,
  insertMarkdownAsset,
  loadPublicAssets,
  loadRandomAsset,
  normalizeStoredAsset,
  readAssetErrorMessage,
} from './assets';

describe('asset client helpers', () => {
  test('builds an upload payload from a browser file', async () => {
    const file = new File(['hello'], 'Hello Image.PNG', { type: 'image/png' });

    await expect(buildAssetUploadPayload(file)).resolves.toEqual({
      filename: 'Hello Image.PNG',
      mimeType: 'image/png',
      base64: 'aGVsbG8=',
    });
  });

  test('infers a standard jpeg mime type for jpg files when the browser leaves file type blank', async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'WechatIMG8477.jpg', { type: '' });

    await expect(buildAssetUploadPayload(file)).resolves.toMatchObject({
      filename: 'WechatIMG8477.jpg',
      mimeType: 'image/jpeg',
    });
  });

  test('normalizes non-standard image jpg mime types before upload', async () => {
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'WechatIMG8477.jpg', { type: 'image/jpg' });

    await expect(buildAssetUploadPayload(file)).resolves.toMatchObject({
      filename: 'WechatIMG8477.jpg',
      mimeType: 'image/jpeg',
    });
  });

  test('uses an optimized image file when it is smaller than the original upload', async () => {
    const file = new File(['original-image-bytes'], 'Cover Image.PNG', { type: 'image/png' });
    const optimized = new File(['webp'], 'cover-image.webp', { type: 'image/webp' });

    await expect(
      buildAssetUploadPayload(file, {
        imageOptimizer: {
          optimize: async () => optimized,
        },
      }),
    ).resolves.toEqual({
      filename: 'cover-image.webp',
      mimeType: 'image/webp',
      base64: 'd2VicA==',
    });
  });

  test('keeps non-image attachments unchanged when preparing upload payloads', async () => {
    const file = new File(['# Notes'], 'notes.md', { type: 'text/markdown' });
    let optimizerCalls = 0;

    await expect(
      buildAssetUploadPayload(file, {
        imageOptimizer: {
          optimize: async () => {
            optimizerCalls += 1;
            return new File(['ignored'], 'ignored.webp', { type: 'image/webp' });
          },
        },
      }),
    ).resolves.toEqual({
      filename: 'notes.md',
      mimeType: 'text/markdown',
      base64: 'IyBOb3Rlcw==',
    });
    expect(optimizerCalls).toBe(0);
  });

  test('does not build repository asset mutation requests in static-site mode', async () => {
    const { buildAdminAssetListRequest, buildPublicAssetListRequest, buildRandomAssetRequest } = await import('./assets');

    expect(buildAssetUploadRequest({
      filename: 'cover.png',
      mimeType: 'image/png',
      base64: 'aGVsbG8=',
      usage: 'cover',
      altText: 'Cover image',
    })).toBeNull();
    expect(buildAdminAssetListRequest({ usage: 'background' })).toBeNull();
    expect(buildAssetDeleteRequest('asset-1')).toBeNull();
    expect(buildPublicAssetListRequest({ usage: 'background' })).toBeNull();
    expect(buildRandomAssetRequest({ usage: 'background' })).toBeNull();
  });

  test('builds an authenticated asset upload request for the asset Worker', () => {
    expect(
      buildAssetUploadRequest({
        filename: 'cover.png',
        mimeType: 'image/png',
        base64: 'aGVsbG8=',
        usage: 'cover',
        altText: 'Cover image',
      }, { assetBaseUrl: 'https://assets.example.workers.dev' }),
    ).toEqual({
      url: 'https://assets.example.workers.dev/admin/assets',
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

  test('reads specific API error messages for asset upload failures', async () => {
    await expect(
      readAssetErrorMessage(
        new Response(JSON.stringify({ message: 'Upload content does not match declared type: image/jpeg' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
        '上传失败。',
      ),
    ).resolves.toBe('Upload content does not match declared type: image/jpeg');

    await expect(
      readAssetErrorMessage(
        new Response(JSON.stringify({ message: ['Upload exceeds 10485760 bytes'] }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
        '上传失败。',
      ),
    ).resolves.toBe('Upload exceeds 10485760 bytes');
  });

  test('falls back to a friendly asset upload error when API response has no readable message', async () => {
    await expect(readAssetErrorMessage(new Response('', { status: 500 }), '上传失败。')).resolves.toBe('上传失败。');
  });

  test('builds gallery list and random image requests for the asset Worker', async () => {
    const { buildAdminAssetListRequest, buildPublicAssetListRequest, buildRandomAssetRequest } = await import('./assets');
    const assetBaseUrl = 'https://assets.example.workers.dev';

    expect(buildAdminAssetListRequest({ usage: 'background', assetBaseUrl })?.url).toBe('https://assets.example.workers.dev/admin/assets?usage=background');
    expect(buildPublicAssetListRequest({ usage: 'background', assetBaseUrl })?.url).toBe('https://assets.example.workers.dev/assets?usage=background');
    expect(buildRandomAssetRequest({ usage: 'background', assetBaseUrl })?.url).toBe('https://assets.example.workers.dev/assets/random?usage=background');
    expect(buildAssetDeleteRequest('asset-1', { assetBaseUrl })).toEqual({
      url: 'https://assets.example.workers.dev/admin/assets/asset-1',
      init: {
        method: 'DELETE',
        credentials: 'include',
      },
    });
  });

  test('routes asset requests to a database-free asset service when configured', async () => {
    const { buildAdminAssetListRequest, buildAssetDeleteRequest, buildAssetUploadRequest, buildPublicAssetListRequest, buildRandomAssetRequest } =
      await import('./assets');

    const assetBaseUrl = 'https://assets.example.workers.dev/';

    expect(buildAssetUploadRequest({ filename: 'cover.png', mimeType: 'image/png', base64: 'aGVsbG8=' }, { assetBaseUrl })?.url).toBe(
      'https://assets.example.workers.dev/admin/assets',
    );
    expect(buildAdminAssetListRequest({ usage: 'cover', assetBaseUrl })?.url).toBe('https://assets.example.workers.dev/admin/assets?usage=cover');
    expect(buildPublicAssetListRequest({ usage: 'background', assetBaseUrl })?.url).toBe(
      'https://assets.example.workers.dev/assets?usage=background',
    );
    expect(buildRandomAssetRequest({ usage: 'background', assetBaseUrl })?.url).toBe(
      'https://assets.example.workers.dev/assets/random?usage=background',
    );
    expect(buildAssetDeleteRequest('asset-1', { assetBaseUrl })?.url).toBe('https://assets.example.workers.dev/admin/assets/asset-1');
  });

  test('loads uploaded background assets for the home hero rotation', async () => {
    await expect(
      loadPublicAssets(
        { usage: 'background', assetBaseUrl: 'https://assets.example.workers.dev/' },
        async (url, init) => {
          expect(url).toBe('https://assets.example.workers.dev/assets?usage=background');
          expect(init).toMatchObject({
            method: 'GET',
            next: {
              revalidate: 60,
            },
          });
          expect(init.signal).toBeInstanceOf(AbortSignal);

          return new Response(
            JSON.stringify([
              {
                id: 'asset-1',
                publicUrl: 'https://cdn.example.com/hero-1.jpg',
                usage: 'background',
              },
              {
                id: 'asset-2',
                publicUrl: 'https://cdn.example.com/hero-2.jpg',
                usage: 'background',
              },
            ]),
          );
        },
      ),
    ).resolves.toMatchObject([
      { id: 'asset-1', publicUrl: 'https://cdn.example.com/hero-1.jpg', usage: 'background' },
      { id: 'asset-2', publicUrl: 'https://cdn.example.com/hero-2.jpg', usage: 'background' },
    ]);

    await expect(loadPublicAssets({ usage: 'background' }, async () => new Response('Not found', { status: 404 }))).resolves.toEqual([]);
  });

  test('uses an empty asset list during server render when no asset Worker is configured', async () => {
    await expect(loadPublicAssets({ usage: 'background' })).resolves.toEqual([]);
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

  test('loads a random background asset with fallback when unavailable', async () => {
    await expect(
      loadRandomAsset(
        { usage: 'background', assetBaseUrl: 'https://assets.example.workers.dev/' },
        async (url, init) => {
          expect(url).toBe('https://assets.example.workers.dev/assets/random?usage=background');
          expect(init).toMatchObject({
            method: 'GET',
            next: {
              revalidate: 60,
            },
          });
          expect(init.signal).toBeInstanceOf(AbortSignal);

          return new Response(
            JSON.stringify({
              id: 'asset-1',
              publicUrl: 'https://cdn.example.com/hero.jpg',
              usage: 'background',
            }),
          );
        },
      ),
    ).resolves.toMatchObject({
      id: 'asset-1',
      publicUrl: 'https://cdn.example.com/hero.jpg',
      usage: 'background',
    });

    await expect(loadRandomAsset({ usage: 'background' }, async () => new Response('Not found', { status: 404 }))).resolves.toBeNull();
  });

  test('uses null random assets during server render when no asset Worker is configured', async () => {
    await expect(loadRandomAsset({ usage: 'background' })).resolves.toBeNull();
  });

  test('builds markdown embeds for images and attachments', () => {
    expect(
      buildMarkdownAssetEmbed(normalizeStoredAsset({
        id: 'asset-image',
        storageKey: '2026/06/cover.png',
        publicUrl: '/uploads/cover.png',
        mimeType: 'image/png',
        byteSize: 10,
        usage: 'content',
        altText: 'Cover image',
        createdAt: '',
      })),
    ).toBe('![Cover image](/uploads/cover.png)');

    expect(
      buildMarkdownAssetEmbed(normalizeStoredAsset({
        id: 'asset-doc',
        storageKey: 'docs/platform-plan.pdf',
        publicUrl: '/uploads/platform-plan.pdf',
        mimeType: 'application/pdf',
        byteSize: 10,
        usage: 'attachment',
        altText: '',
        createdAt: '',
      })),
    ).toBe('[platform-plan.pdf](/uploads/platform-plan.pdf)');
  });

  test('inserts markdown asset embeds at the selected range', () => {
    const asset = normalizeStoredAsset({
      id: 'asset-image',
      storageKey: '2026/06/diagram.png',
      publicUrl: '/uploads/diagram.png',
      mimeType: 'image/png',
      byteSize: 10,
      usage: 'content',
      altText: 'System diagram',
      createdAt: '',
    });

    expect(insertMarkdownAsset('Hello world', asset, { start: 6, end: 11 })).toEqual({
      markdown: 'Hello ![System diagram](/uploads/diagram.png)',
      selectionStart: 45,
      selectionEnd: 45,
    });
  });
});

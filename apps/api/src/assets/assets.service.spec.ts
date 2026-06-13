import { afterEach, describe, expect, test, vi } from 'vitest';
import sharp from 'sharp';

import { LocalAssetStorage, S3AssetStorage } from './storage.service.js';
import { InMemoryAssetRepository } from './assets.repository.js';
import { AssetsService, createAssetStorage, optimizeAssetUpload } from './assets.service.js';

describe('createAssetStorage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('creates local storage when configured for local uploads', () => {
    vi.stubEnv('STORAGE_DRIVER', 'local');

    expect(createAssetStorage()).toBeInstanceOf(LocalAssetStorage);
  });

  test('creates S3-compatible storage when configured for object storage', () => {
    vi.stubEnv('STORAGE_DRIVER', 's3');
    vi.stubEnv('S3_BUCKET', 'starry-summer');
    vi.stubEnv('S3_ACCESS_KEY', 'access-key');
    vi.stubEnv('S3_SECRET_KEY', 'secret-key');

    expect(createAssetStorage()).toBeInstanceOf(S3AssetStorage);
  });

  test('rejects unsupported storage drivers', () => {
    vi.stubEnv('STORAGE_DRIVER', 'ftp');

    expect(() => createAssetStorage()).toThrow('Unsupported STORAGE_DRIVER "ftp"');
  });
});

describe('AssetsService', () => {
  test('optimizes large web images before storage', async () => {
    const original = await sharp({
      create: {
        width: 2600,
        height: 1800,
        channels: 3,
        background: '#d8c7a3',
      },
    })
      .jpeg({ quality: 100 })
      .toBuffer();

    const optimized = await optimizeAssetUpload({
      filename: 'Large Cover.JPG',
      mimeType: 'image/jpeg',
      bytes: original,
    });
    const metadata = await sharp(optimized.bytes).metadata();

    expect(optimized.filename).toBe('Large Cover.webp');
    expect(optimized.mimeType).toBe('image/webp');
    expect(optimized.bytes.byteLength).toBeLessThan(original.byteLength);
    expect(metadata.width).toBeLessThanOrEqual(1920);
    expect(metadata.height).toBeLessThanOrEqual(1920);
  });

  test('leaves non-image asset uploads unchanged', async () => {
    const original = Buffer.from('# Portable note');

    await expect(
      optimizeAssetUpload({
        filename: 'note.md',
        mimeType: 'text/markdown',
        bytes: original,
      }),
    ).resolves.toEqual({
      filename: 'note.md',
      mimeType: 'text/markdown',
      bytes: original,
    });
  });

  test('stores optimized upload bytes and metadata', async () => {
    const savedInputs: Array<{ filename: string; mimeType: string; bytes: Buffer }> = [];
    const service = new AssetsService(
      {
        save: async (input) => {
          savedInputs.push(input);

          return {
            storageKey: 'optimized-cover.webp',
            publicUrl: '/uploads/optimized-cover.webp',
            mimeType: input.mimeType,
            byteSize: input.bytes.byteLength,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
      () => 0,
      async () => ({
        filename: 'cover.webp',
        mimeType: 'image/webp',
        bytes: Buffer.from('optimized-webp'),
      }),
    );

    const uploaded = await service.upload({
      filename: 'cover.jpg',
      mimeType: 'image/jpeg',
      base64: Buffer.from('original-jpeg').toString('base64'),
      usage: 'cover',
    });

    expect(savedInputs).toEqual([
      {
        filename: 'cover.webp',
        mimeType: 'image/webp',
        bytes: Buffer.from('optimized-webp'),
      },
    ]);
    expect(uploaded).toMatchObject({
      mimeType: 'image/webp',
      byteSize: 'optimized-webp'.length,
    });
  });

  test('normalizes non-standard jpg mime types before storage validation', async () => {
    const savedInputs: Array<{ filename: string; mimeType: string; bytes: Buffer }> = [];
    const service = new AssetsService(
      {
        save: async (input) => {
          savedInputs.push(input);

          return {
            storageKey: 'wechat-image.jpg',
            publicUrl: '/uploads/wechat-image.jpg',
            mimeType: input.mimeType,
            byteSize: input.bytes.byteLength,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
    );

    await service.upload({
      filename: 'WechatIMG8477.jpg',
      mimeType: 'image/jpg',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64'),
      usage: 'content',
    });

    expect(savedInputs).toMatchObject([
      {
        filename: 'WechatIMG8477.jpg',
        mimeType: 'image/jpeg',
      },
    ]);
  });

  test('infers jpeg mime type from jpg filenames when API clients send generic mime types', async () => {
    const savedInputs: Array<{ filename: string; mimeType: string; bytes: Buffer }> = [];
    const service = new AssetsService(
      {
        save: async (input) => {
          savedInputs.push(input);

          return {
            storageKey: input.filename,
            publicUrl: `/uploads/${input.filename}`,
            mimeType: input.mimeType,
            byteSize: input.bytes.byteLength,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
    );

    await service.upload({
      filename: 'WechatIMG8477.jpg',
      mimeType: 'application/octet-stream',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64'),
      usage: 'content',
    });
    await service.upload({
      filename: 'AnotherPhoto.JPEG',
      mimeType: '',
      base64: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString('base64'),
      usage: 'cover',
    });

    expect(savedInputs).toMatchObject([
      {
        filename: 'WechatIMG8477.jpg',
        mimeType: 'image/jpeg',
      },
      {
        filename: 'AnotherPhoto.JPEG',
        mimeType: 'image/jpeg',
      },
    ]);
  });

  test('rejects malformed base64 upload payloads before storage writes', async () => {
    let saveCalls = 0;
    const service = new AssetsService(
      {
        save: async () => {
          saveCalls += 1;

          return {
            storageKey: 'should-not-exist.png',
            publicUrl: '/uploads/should-not-exist.png',
            mimeType: 'image/png',
            byteSize: 1,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
    );

    await expect(
      service.upload({
        filename: 'broken.png',
        mimeType: 'image/png',
        base64: 'not-base64!!',
      }),
    ).rejects.toThrow('Asset upload payload must be valid base64');
    expect(saveCalls).toBe(0);
  });

  test('rejects invalid upload field types before storage writes', async () => {
    let saveCalls = 0;
    const service = new AssetsService(
      {
        save: async () => {
          saveCalls += 1;

          return {
            storageKey: 'should-not-exist.png',
            publicUrl: '/uploads/should-not-exist.png',
            mimeType: 'image/png',
            byteSize: 1,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
    );

    await expect(
      service.upload({
        filename: 123,
        mimeType: 'image/png',
        base64: Buffer.from('png-bytes').toString('base64'),
      } as never),
    ).rejects.toThrow('Asset upload filename, mimeType, and base64 must be strings');
    expect(saveCalls).toBe(0);
  });

  test('rejects missing upload bodies before storage writes', async () => {
    let saveCalls = 0;
    const service = new AssetsService(
      {
        save: async () => {
          saveCalls += 1;

          return {
            storageKey: 'should-not-exist.png',
            publicUrl: '/uploads/should-not-exist.png',
            mimeType: 'image/png',
            byteSize: 1,
          };
        },
        delete: async () => undefined,
      },
      new InMemoryAssetRepository(),
    );

    await expect(service.upload(null as never)).rejects.toThrow(
      'Asset upload filename, mimeType, and base64 must be strings',
    );
    expect(saveCalls).toBe(0);
  });

  test('stores uploaded asset metadata and filters the gallery by usage', async () => {
    const repository = new InMemoryAssetRepository(() => '2026-06-10T00:00:00.000Z');
    const service = new AssetsService(
      {
        save: async () => ({
          storageKey: '2026/06/10/hero.png',
          publicUrl: '/uploads/2026/06/10/hero.png',
          mimeType: 'image/png',
          byteSize: 9,
        }),
        delete: async () => undefined,
      },
      repository,
    );

    const uploaded = await service.upload({
      filename: 'Hero.PNG',
      mimeType: 'image/png',
      base64: Buffer.from('png-bytes').toString('base64'),
      usage: 'background',
      altText: 'Hero background',
    });

    await service.upload({
      filename: 'Cover.PNG',
      mimeType: 'image/png',
      base64: Buffer.from('cover').toString('base64'),
      usage: 'cover',
    });

    expect(uploaded).toMatchObject({
      id: '1',
      storageKey: '2026/06/10/hero.png',
      publicUrl: '/uploads/2026/06/10/hero.png',
      mimeType: 'image/png',
      byteSize: 9,
      usage: 'background',
      altText: 'Hero background',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
    expect(await service.list({ usage: 'background' })).toEqual([uploaded]);
  });

  test('returns a deterministic random asset from a usage group', async () => {
    const repository = new InMemoryAssetRepository(() => '2026-06-10T00:00:00.000Z');
    const service = new AssetsService(
      {
        save: async (input) => ({
          storageKey: input.filename,
          publicUrl: `/uploads/${input.filename}`,
          mimeType: input.mimeType,
          byteSize: input.bytes.byteLength,
        }),
        delete: async () => undefined,
      },
      repository,
      () => 0.75,
    );

    await service.upload({
      filename: 'first.png',
      mimeType: 'image/png',
      base64: Buffer.from('first').toString('base64'),
      usage: 'background',
    });
    const second = await service.upload({
      filename: 'second.png',
      mimeType: 'image/png',
      base64: Buffer.from('second').toString('base64'),
      usage: 'background',
    });

    await expect(service.random({ usage: 'background' })).resolves.toEqual(second);
    await expect(service.random({ usage: 'cover' })).resolves.toBeNull();
  });

  test('deletes uploaded asset metadata from the gallery', async () => {
    const repository = new InMemoryAssetRepository(() => '2026-06-10T00:00:00.000Z');
    const deletedStorageKeys: string[] = [];
    const service = new AssetsService(
      {
        save: async (input) => ({
          storageKey: input.filename,
          publicUrl: `/uploads/${input.filename}`,
          mimeType: input.mimeType,
          byteSize: input.bytes.byteLength,
        }),
        delete: async (storageKey) => {
          deletedStorageKeys.push(storageKey);
        },
      },
      repository,
    );

    const uploaded = await service.upload({
      filename: 'unused.png',
      mimeType: 'image/png',
      base64: Buffer.from('unused').toString('base64'),
      usage: 'content',
    });

    await expect(service.delete(uploaded.id)).resolves.toBeUndefined();
    expect(deletedStorageKeys).toEqual(['unused.png']);
    await expect(service.list()).resolves.toEqual([]);
    await expect(service.delete(uploaded.id)).rejects.toThrow('Asset 1 was not found');
    expect(deletedStorageKeys).toEqual(['unused.png']);
  });
});

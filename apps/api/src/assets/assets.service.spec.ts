import { afterEach, describe, expect, test, vi } from 'vitest';

import { LocalAssetStorage } from './storage.service.js';
import { InMemoryAssetRepository } from './assets.repository.js';
import { AssetsService, createAssetStorage } from './assets.service.js';

describe('createAssetStorage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('creates local storage when configured for local uploads', () => {
    vi.stubEnv('STORAGE_DRIVER', 'local');

    expect(createAssetStorage()).toBeInstanceOf(LocalAssetStorage);
  });

  test('rejects unsupported storage drivers', () => {
    vi.stubEnv('STORAGE_DRIVER', 's3');

    expect(() => createAssetStorage()).toThrow('Unsupported STORAGE_DRIVER "s3"');
  });
});

describe('AssetsService', () => {
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
});

import { describe, expect, test } from 'vitest';

import { InMemoryAssetRepository } from './assets.repository';

describe('InMemoryAssetRepository', () => {
  test('deletes asset records permanently', async () => {
    const repository = new InMemoryAssetRepository(() => '2026-06-10T00:00:00.000Z');
    const asset = await repository.create({
      storageKey: '2026/06/10/cover.png',
      publicUrl: '/uploads/2026/06/10/cover.png',
      mimeType: 'image/png',
      byteSize: 9,
      usage: 'cover',
      altText: 'Cover',
    });

    await expect(repository.delete(asset.id)).resolves.toBe(true);
    await expect(repository.list()).resolves.toEqual([]);
    await expect(repository.delete(asset.id)).resolves.toBe(false);
  });
});

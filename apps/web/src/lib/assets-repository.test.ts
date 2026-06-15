import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, test } from 'vitest';

import { loadRepositoryAssets, loadRepositoryRandomAsset, readRepositoryAssetsFile } from './assets-repository';

describe('repository asset source', () => {
  test('reads versioned assets from a repository manifest', () => {
    const assetsFilePath = writeAssetManifest([
      {
        id: 'asset-cover',
        storageKey: 'images/cover.png',
        publicUrl: '/images/cover.png',
        mimeType: 'image/png',
        byteSize: 10,
        usage: 'cover',
        altText: 'Cover',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
    ]);

    expect(readRepositoryAssetsFile(assetsFilePath)).toEqual([
      {
        id: 'asset-cover',
        storageKey: 'images/cover.png',
        publicUrl: '/images/cover.png',
        mimeType: 'image/png',
        byteSize: 10,
        usage: 'cover',
        altText: 'Cover',
        createdAt: '2026-06-10T00:00:00.000Z',
      },
    ]);
  });

  test('filters assets by usage and returns newest assets first', async () => {
    const assetsFilePath = writeAssetManifest([
      {
        id: 'old-cover',
        publicUrl: '/images/old-cover.png',
        mimeType: 'image/png',
        usage: 'cover',
        createdAt: '2026-06-09T00:00:00.000Z',
      },
      {
        id: 'background',
        publicUrl: '/images/background.png',
        mimeType: 'image/png',
        usage: 'background',
        createdAt: '2026-06-11T00:00:00.000Z',
      },
      {
        id: 'new-cover',
        publicUrl: '/images/new-cover.png',
        mimeType: 'image/png',
        usage: 'cover',
        createdAt: '2026-06-12T00:00:00.000Z',
      },
    ]);

    await expect(loadRepositoryAssets({ assetsFilePath, usage: 'cover' })).resolves.toMatchObject({
      source: 'repository-file',
      assets: [
        { id: 'new-cover', publicUrl: '/images/new-cover.png', usage: 'cover' },
        { id: 'old-cover', publicUrl: '/images/old-cover.png', usage: 'cover' },
      ],
    });
  });

  test('uses repository assets as the random fallback without contacting the API', async () => {
    const assetsFilePath = writeAssetManifest([
      {
        id: 'night-background',
        publicUrl: '/images/night.png',
        mimeType: 'image/png',
        usage: 'background',
        createdAt: '2026-06-12T00:00:00.000Z',
      },
    ]);

    await expect(loadRepositoryRandomAsset({ assetsFilePath, usage: 'background' })).resolves.toMatchObject({
      id: 'night-background',
      publicUrl: '/images/night.png',
      usage: 'background',
    });
  });

  test('falls back to an empty asset list when the manifest is unavailable', async () => {
    await expect(loadRepositoryAssets({ assetsFilePath: join(tmpdir(), 'missing-starry-assets.json') })).resolves.toEqual({
      source: 'fallback',
      assets: [],
    });
  });
});

function writeAssetManifest(records: unknown[]): string {
  const directory = join(tmpdir(), `starry-assets-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(directory, { recursive: true });
  const assetsFilePath = join(directory, 'assets.json');
  writeFileSync(assetsFilePath, JSON.stringify(records), 'utf8');

  return assetsFilePath;
}

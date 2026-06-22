import { describe, expect, test } from 'vitest';

import {
  buildRepositoryAssetUploadFiles,
  removeRepositoryAssetIndexItem,
  type RepositoryAssetUploadPayload,
} from './repository-assets-publish';
import type { StoredAsset } from './assets';

const existingAsset: StoredAsset = {
  id: 'asset-existing',
  storageKey: 'images/uploads/existing.png',
  publicUrl: '/images/uploads/existing.png',
  mimeType: 'image/png',
  byteSize: 12,
  usage: 'cover',
  altText: 'Existing image',
  createdAt: '2026-06-13T00:00:00.000Z',
};

describe('repository asset publishing', () => {
  test('builds GitHub files for uploaded assets and updates the repository asset index', () => {
    const payload: RepositoryAssetUploadPayload = {
      filename: 'My Cover.PNG',
      mimeType: 'image/png',
      base64: Buffer.from('hello', 'utf8').toString('base64'),
      usage: 'cover',
      altText: 'Cover image',
    };

    expect(
      buildRepositoryAssetUploadFiles(payload, [existingAsset], {
        now: new Date('2026-06-18T10:20:30.000Z'),
      }),
    ).toEqual({
      asset: {
        id: 'asset-20260618-102030-my-cover.png',
        storageKey: 'images/uploads/2026/06/20260618-102030-my-cover.png',
        publicUrl: '/images/uploads/2026/06/20260618-102030-my-cover.png',
        mimeType: 'image/png',
        byteSize: 5,
        usage: 'cover',
        altText: 'Cover image',
        createdAt: '2026-06-18T10:20:30.000Z',
      },
      files: [
        {
          path: 'apps/web/public/images/uploads/2026/06/20260618-102030-my-cover.png',
          content: 'aGVsbG8=',
          encoding: 'base64',
        },
        {
          path: 'apps/web/content/assets.json',
          content: `${JSON.stringify([
            {
              id: 'asset-20260618-102030-my-cover.png',
              storageKey: 'images/uploads/2026/06/20260618-102030-my-cover.png',
              publicUrl: '/images/uploads/2026/06/20260618-102030-my-cover.png',
              mimeType: 'image/png',
              byteSize: 5,
              usage: 'cover',
              altText: 'Cover image',
              createdAt: '2026-06-18T10:20:30.000Z',
            },
            existingAsset,
          ], null, 2)}\n`,
        },
      ],
    });
  });

  test('removes deleted assets from the repository index without deleting historical files', () => {
    expect(removeRepositoryAssetIndexItem([existingAsset], 'asset-existing')).toEqual({
      removed: existingAsset,
      assets: [],
      files: [
        {
          path: 'apps/web/content/assets.json',
          content: '[]\n',
        },
      ],
    });
  });
});

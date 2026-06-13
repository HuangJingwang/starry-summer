import { describe, expect, test } from 'vitest';

import { buildHomePhotoAlbumItems, type HomePhotoAlbumImage } from './home-photo-album';

describe('home photo album helpers', () => {
  const portrait: HomePhotoAlbumImage = {
    url: '/images/default-post-cover.png',
    alt: 'Aster.H 的内容封面',
  };

  const backgrounds: HomePhotoAlbumImage[] = [
    { url: '/images/default-post-cover.png', alt: '默认内容封面' },
  ];

  test('uses uploaded content images for the home photo album', () => {
    expect(
      buildHomePhotoAlbumItems({
        contentAssets: [
          {
            id: 'photo-1',
            storageKey: 'photo-1.jpg',
            publicUrl: '/uploads/photo-1.jpg',
            mimeType: 'image/jpeg',
            byteSize: 10,
            usage: 'content',
            altText: '海边照片',
            createdAt: '2026-06-11',
          },
          {
            id: 'file-1',
            storageKey: 'file-1.pdf',
            publicUrl: '/uploads/file-1.pdf',
            mimeType: 'application/pdf',
            byteSize: 10,
            usage: 'content',
            altText: 'PDF',
            createdAt: '2026-06-11',
          },
        ],
        portrait,
        backgrounds,
      }),
    ).toEqual([
      {
        url: '/uploads/photo-1.jpg',
        alt: '海边照片',
        caption: 'Photo 01',
      },
    ]);
  });

  test('falls back to portrait and hero backgrounds when no content photos exist', () => {
    expect(
      buildHomePhotoAlbumItems({
        contentAssets: [],
        portrait,
        backgrounds,
      }),
    ).toEqual([
      {
        url: '/images/default-post-cover.png',
        alt: 'Aster.H 的内容封面',
        caption: 'Portrait',
      },
      {
        url: '/images/default-post-cover.png',
        alt: '默认内容封面',
        caption: 'Memory 01',
      },
    ]);
  });
});

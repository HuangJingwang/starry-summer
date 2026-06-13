import { describe, expect, test } from 'vitest';

import { buildHomePhotoAlbumItems, type HomePhotoAlbumImage } from './home-photo-album';

describe('home photo album helpers', () => {
  const portrait: HomePhotoAlbumImage = {
    url: '/images/aster-profile.png',
    alt: 'Aster.H 的个人照片',
  };

  const backgrounds: HomePhotoAlbumImage[] = [
    { url: '/hero-workspace.png', alt: '首页默认背景图' },
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
        url: '/images/aster-profile.png',
        alt: 'Aster.H 的个人照片',
        caption: 'Portrait',
      },
      {
        url: '/hero-workspace.png',
        alt: '首页默认背景图',
        caption: 'Memory 01',
      },
    ]);
  });
});

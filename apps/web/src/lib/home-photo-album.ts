import type { StoredAsset } from './assets';

export interface HomePhotoAlbumImage {
  url: string;
  alt: string;
}

export interface HomePhotoAlbumItem extends HomePhotoAlbumImage {
  caption: string;
}

export interface HomePhotoAlbumInput {
  contentAssets: StoredAsset[];
  portrait: HomePhotoAlbumImage;
  backgrounds: HomePhotoAlbumImage[];
}

export function buildHomePhotoAlbumItems({
  contentAssets,
  portrait,
  backgrounds,
}: HomePhotoAlbumInput): HomePhotoAlbumItem[] {
  const uploadedPhotos = contentAssets
    .filter((asset) => asset.publicUrl && asset.mimeType.startsWith('image/'))
    .slice(0, 6)
    .map((asset, index) => ({
      url: asset.publicUrl,
      alt: asset.altText || `相册照片 ${index + 1}`,
      caption: `Photo ${String(index + 1).padStart(2, '0')}`,
    }));

  if (uploadedPhotos.length > 0) {
    return uploadedPhotos;
  }

  return [
    {
      ...portrait,
      caption: 'Portrait',
    },
    ...backgrounds.slice(0, 5).map((background, index) => ({
      ...background,
      caption: `Memory ${String(index + 1).padStart(2, '0')}`,
    })),
  ];
}

import { describe, expect, test } from 'vitest';

import { resolveLocalUploadsStaticConfig } from './local-uploads';

describe('local upload static assets', () => {
  test('mounts local uploads at the configured public path', () => {
    expect(
      resolveLocalUploadsStaticConfig({
        STORAGE_DRIVER: 'local',
        LOCAL_UPLOAD_DIR: '/app/uploads',
        LOCAL_UPLOAD_PUBLIC_URL: '/uploads',
      }),
    ).toEqual({
      directory: '/app/uploads',
      prefix: '/uploads/',
    });
  });

  test('does not mount static uploads for object storage or external public URLs', () => {
    expect(
      resolveLocalUploadsStaticConfig({
        STORAGE_DRIVER: 's3',
        LOCAL_UPLOAD_DIR: '/app/uploads',
        LOCAL_UPLOAD_PUBLIC_URL: '/uploads',
      }),
    ).toBeNull();

    expect(
      resolveLocalUploadsStaticConfig({
        STORAGE_DRIVER: 'local',
        LOCAL_UPLOAD_DIR: '/app/uploads',
        LOCAL_UPLOAD_PUBLIC_URL: 'https://assets.example.com/uploads',
      }),
    ).toBeNull();
  });
});

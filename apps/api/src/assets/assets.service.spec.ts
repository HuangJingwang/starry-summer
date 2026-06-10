import { afterEach, describe, expect, test, vi } from 'vitest';

import { LocalAssetStorage } from './storage.service.js';
import { createAssetStorage } from './assets.service.js';

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

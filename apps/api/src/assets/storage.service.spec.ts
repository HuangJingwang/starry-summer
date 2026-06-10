import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { LocalAssetStorage, assertAllowedUpload } from './storage.service';

describe('asset storage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'starry-assets-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('rejects unsupported mime types', () => {
    expect(() => assertAllowedUpload({ mimeType: 'application/x-msdownload', byteSize: 128 })).toThrow(
      'Unsupported upload type',
    );
  });

  test('rejects oversized files', () => {
    expect(() => assertAllowedUpload({ mimeType: 'image/png', byteSize: 12 * 1024 * 1024 })).toThrow(
      'Upload exceeds',
    );
  });

  test('stores files with safe keys and public urls', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
    });

    const result = await storage.save({
      filename: '../Hero Image.PNG',
      mimeType: 'image/png',
      bytes: Buffer.from('png-bytes'),
    });

    expect(result.storageKey).toBe('2026/06/10/hero-image.png');
    expect(result.publicUrl).toBe('/uploads/2026/06/10/hero-image.png');
    await expect(readFile(join(dir, result.storageKey), 'utf8')).resolves.toBe('png-bytes');
  });
});

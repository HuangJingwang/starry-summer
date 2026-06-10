import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { BadRequestException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { LocalAssetStorage, S3AssetStorage, assertAllowedUpload } from './storage.service';

const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('asset storage', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'starry-assets-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('rejects unsupported mime types', () => {
    expect(() => assertAllowedUpload({ mimeType: 'application/x-msdownload', byteSize: 128 })).toThrow(BadRequestException);
    expect(() => assertAllowedUpload({ mimeType: 'application/x-msdownload', byteSize: 128 })).toThrow('Unsupported upload type');
  });

  test('rejects oversized files', () => {
    expect(() => assertAllowedUpload({ mimeType: 'image/png', byteSize: 12 * 1024 * 1024 })).toThrow(BadRequestException);
    expect(() => assertAllowedUpload({ mimeType: 'image/png', byteSize: 12 * 1024 * 1024 })).toThrow('Upload exceeds');
  });

  test('rejects empty uploads', () => {
    expect(() => assertAllowedUpload({ mimeType: 'image/png', byteSize: 0 })).toThrow(BadRequestException);
    expect(() => assertAllowedUpload({ mimeType: 'image/png', byteSize: 0 })).toThrow('Upload is empty');
  });

  test('rejects binary uploads whose content does not match the declared type', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
    });

    await expect(
      storage.save({
        filename: 'fake.png',
        mimeType: 'image/png',
        bytes: Buffer.from('<script>alert(1)</script>'),
      }),
    ).rejects.toThrow('Upload content does not match declared type: image/png');
  });

  test('stores files with safe keys and public urls', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
      randomId: () => 'fixed',
    });

    const result = await storage.save({
      filename: '../Hero Image.PNG',
      mimeType: 'image/png',
      bytes: pngBytes,
    });

    expect(result.storageKey).toBe('2026/06/10/hero-image-fixed.png');
    expect(result.publicUrl).toBe('/uploads/2026/06/10/hero-image-fixed.png');
    await expect(readFile(join(dir, result.storageKey))).resolves.toEqual(pngBytes);
  });

  test('uses the declared content type to choose the stored file extension', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
      randomId: () => 'fixed',
    });

    const textResult = await storage.save({
      filename: 'evil.html',
      mimeType: 'text/plain',
      bytes: Buffer.from('plain text'),
    });
    const imageResult = await storage.save({
      filename: 'hero.txt',
      mimeType: 'image/png',
      bytes: pngBytes,
    });

    expect(textResult.storageKey).toBe('2026/06/10/evil-fixed.txt');
    expect(textResult.publicUrl).toBe('/uploads/2026/06/10/evil-fixed.txt');
    expect(imageResult.storageKey).toBe('2026/06/10/hero-fixed.png');
    expect(imageResult.publicUrl).toBe('/uploads/2026/06/10/hero-fixed.png');
  });

  test('stores repeated filenames under distinct keys', async () => {
    const suffixes = ['first', 'second'];
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
      randomId: () => suffixes.shift() ?? 'fallback',
    });

    const first = await storage.save({
      filename: 'Hero Note.txt',
      mimeType: 'text/plain',
      bytes: Buffer.from('first'),
    });
    const second = await storage.save({
      filename: 'Hero Note.txt',
      mimeType: 'text/plain',
      bytes: Buffer.from('second'),
    });

    expect(first.storageKey).toBe('2026/06/10/hero-note-first.txt');
    expect(second.storageKey).toBe('2026/06/10/hero-note-second.txt');
    await expect(readFile(join(dir, first.storageKey), 'utf8')).resolves.toBe('first');
    await expect(readFile(join(dir, second.storageKey), 'utf8')).resolves.toBe('second');
  });

  test('deletes stored local files by storage key', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
      randomId: () => 'fixed',
    });

    const result = await storage.save({
      filename: 'Hero Image.PNG',
      mimeType: 'image/png',
      bytes: pngBytes,
    });

    await storage.delete(result.storageKey);

    await expect(access(join(dir, result.storageKey))).rejects.toThrow();
  });

  test('rejects unsafe local delete keys', async () => {
    const storage = new LocalAssetStorage({
      uploadDir: dir,
      publicBaseUrl: '/uploads',
    });

    await expect(storage.delete('../outside.png')).rejects.toThrow('Unsafe storage key');
  });

  test('uploads files to S3-compatible storage with safe keys and public urls', async () => {
    const sent: unknown[] = [];
    const storage = new S3AssetStorage({
      bucket: 'starry-summer',
      publicBaseUrl: 'https://assets.example.com',
      now: () => new Date('2026-06-10T00:00:00.000Z'),
      randomId: () => 'fixed',
      send: async (command) => {
        sent.push(command);
      },
    });

    const result = await storage.save({
      filename: '../Hero Image.PNG',
      mimeType: 'image/png',
      bytes: pngBytes,
    });

    expect(result).toEqual({
      storageKey: '2026/06/10/hero-image-fixed.png',
      publicUrl: 'https://assets.example.com/2026/06/10/hero-image-fixed.png',
      mimeType: 'image/png',
      byteSize: pngBytes.byteLength,
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      input: {
        Bucket: 'starry-summer',
        Key: '2026/06/10/hero-image-fixed.png',
        Body: pngBytes,
        ContentType: 'image/png',
      },
    });
  });

  test('deletes files from S3-compatible storage by storage key', async () => {
    const sent: unknown[] = [];
    const storage = new S3AssetStorage({
      bucket: 'starry-summer',
      publicBaseUrl: 'https://assets.example.com',
      send: async (command) => {
        sent.push(command);
      },
    });

    await storage.delete('2026/06/10/hero-image.png');

    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({
      input: {
        Bucket: 'starry-summer',
        Key: '2026/06/10/hero-image.png',
      },
    });
  });
});

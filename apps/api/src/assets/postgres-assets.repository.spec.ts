import { describe, expect, test } from 'vitest';

import {
  buildAssetInsert,
  buildAssetSelect,
  mapAssetRow,
  type AssetRow,
} from './postgres-assets.repository';

describe('PostgresAssetsRepository mapping', () => {
  test('maps asset rows to API records', () => {
    const row: AssetRow = {
      id: 'asset-1',
      storage_key: '2026/06/10/hero.png',
      public_url: '/uploads/2026/06/10/hero.png',
      mime_type: 'image/png',
      byte_size: 9,
      usage: 'background',
      alt_text: 'Hero background',
      created_at: new Date('2026-06-10T00:00:00.000Z'),
    };

    expect(mapAssetRow(row)).toEqual({
      id: 'asset-1',
      storageKey: '2026/06/10/hero.png',
      publicUrl: '/uploads/2026/06/10/hero.png',
      mimeType: 'image/png',
      byteSize: 9,
      usage: 'background',
      altText: 'Hero background',
      createdAt: '2026-06-10T00:00:00.000Z',
    });
  });

  test('builds insert SQL with usage and alt text', () => {
    const insert = buildAssetInsert({
      storageKey: '2026/06/10/hero.png',
      publicUrl: '/uploads/2026/06/10/hero.png',
      mimeType: 'image/png',
      byteSize: 9,
      usage: 'background',
      altText: 'Hero background',
    });

    expect(insert.sql).toContain('insert into assets');
    expect(insert.sql).toContain('usage');
    expect(insert.sql).toContain('alt_text');
    expect(insert.values).toEqual([
      '2026/06/10/hero.png',
      '/uploads/2026/06/10/hero.png',
      'image/png',
      9,
      'background',
      'Hero background',
    ]);
  });

  test('builds asset select SQL with optional usage filtering', () => {
    expect(buildAssetSelect({ usage: 'background' })).toEqual({
      sql: 'select * from assets where usage = $1 order by created_at desc',
      values: ['background'],
    });
    expect(buildAssetSelect()).toEqual({
      sql: 'select * from assets order by created_at desc',
      values: [],
    });
  });
});

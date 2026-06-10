import { describe, expect, test } from 'vitest';

import {
  buildTaxonomyDelete,
  buildTaxonomyInsert,
  buildTaxonomyList,
  buildTaxonomyUpdate,
  mapTaxonomyRow,
  type TaxonomyRow,
} from './postgres-taxonomy.repository';

describe('Postgres taxonomy repository mapping', () => {
  test('maps database rows to taxonomy terms', () => {
    const row: TaxonomyRow = {
      id: 'term-1',
      name: 'Writing',
      slug: 'writing',
      description: 'Long form',
      sort_order: 3,
      created_at: new Date('2026-06-10T00:00:00.000Z'),
      updated_at: new Date('2026-06-10T01:00:00.000Z'),
    };

    expect(mapTaxonomyRow('category', row)).toEqual({
      id: 'term-1',
      type: 'category',
      name: 'Writing',
      slug: 'writing',
      description: 'Long form',
      sortOrder: 3,
      createdAt: '2026-06-10T00:00:00.000Z',
      updatedAt: '2026-06-10T01:00:00.000Z',
    });
  });

  test('builds SQL against the correct taxonomy table', () => {
    expect(buildTaxonomyList('tag').sql).toContain('from tags');
    expect(buildTaxonomyInsert({ type: 'series', name: 'Build Log', slug: 'build-log', description: '', sortOrder: 1 }).sql).toContain(
      'insert into series',
    );
    expect(buildTaxonomyDelete('category', 'term-1')).toEqual({
      sql: 'delete from categories where id = $1',
      values: ['term-1'],
    });
  });

  test('builds update SQL for taxonomy fields', () => {
    const update = buildTaxonomyUpdate('tag', 'term-1', {
      name: 'Updated',
      slug: 'updated',
      description: 'New description',
      sortOrder: 5,
    });

    expect(update).not.toBeNull();
    expect(update?.sql).toContain('update tags');
    expect(update?.sql).toContain('name = $2');
    expect(update?.sql).toContain('sort_order = $5');
    expect(update?.values).toEqual(['term-1', 'Updated', 'updated', 'New description', 5]);
  });
});

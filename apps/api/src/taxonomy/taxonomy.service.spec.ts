import { beforeEach, describe, expect, test } from 'vitest';

import { InMemoryTaxonomyRepository } from './taxonomy.repository';
import { TaxonomyService } from './taxonomy.service';

describe('TaxonomyService', () => {
  let service: TaxonomyService;

  beforeEach(() => {
    service = new TaxonomyService(new InMemoryTaxonomyRepository(() => '2026-06-10T00:00:00.000Z'));
  });

  test('creates taxonomy terms with generated slugs', async () => {
    const category = await service.createTerm('category', {
      name: 'Long Form Writing',
      description: 'Articles and essays',
    });

    expect(category).toMatchObject({
      type: 'category',
      name: 'Long Form Writing',
      slug: 'long-form-writing',
      description: 'Articles and essays',
      sortOrder: 0,
    });
  });

  test('lists terms separated by taxonomy type', async () => {
    await service.createTerm('category', { name: 'Writing' });
    await service.createTerm('tag', { name: 'Next.js' });
    await service.createTerm('series', { name: 'Platform Notes' });

    expect((await service.listTerms('category')).map((term) => term.name)).toEqual(['Writing']);
    expect((await service.listTerms('tag')).map((term) => term.name)).toEqual(['Next.js']);
    expect((await service.listTerms('series')).map((term) => term.name)).toEqual(['Platform Notes']);
  });

  test('rejects duplicate slugs within the same taxonomy type', async () => {
    await service.createTerm('tag', { name: 'Markdown' });

    await expect(service.createTerm('tag', { name: 'Markdown' })).rejects.toThrow('already exists');
    await expect(service.createTerm('category', { name: 'Markdown' })).resolves.toMatchObject({
      type: 'category',
      slug: 'markdown',
    });
  });

  test('updates taxonomy terms', async () => {
    const tag = await service.createTerm('tag', { name: 'Old Name' });

    const updated = await service.updateTerm('tag', tag.id, {
      name: 'New Name',
      slug: 'custom-slug',
      description: 'Updated',
    });

    expect(updated).toMatchObject({
      id: tag.id,
      name: 'New Name',
      slug: 'custom-slug',
      description: 'Updated',
    });
  });

  test('preserves existing fields during partial updates', async () => {
    const category = await service.createTerm('category', {
      name: 'Writing',
      slug: 'writing',
      description: 'Essays',
      sortOrder: 3,
    });

    const updated = await service.updateTerm('category', category.id, {
      description: 'Updated essays',
    });

    expect(updated).toMatchObject({
      name: 'Writing',
      slug: 'writing',
      description: 'Updated essays',
      sortOrder: 3,
    });
  });

  test('deletes taxonomy terms', async () => {
    const series = await service.createTerm('series', { name: 'Build Log' });

    await service.deleteTerm('series', series.id);

    expect(await service.listTerms('series')).toEqual([]);
  });

  test('rejects unsupported taxonomy types', async () => {
    await expect(service.listTerms('topic' as never)).rejects.toThrow('Unsupported taxonomy type');
  });
});

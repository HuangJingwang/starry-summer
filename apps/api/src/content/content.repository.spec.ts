import { describe, expect, test } from 'vitest';

import { InMemoryContentRepository } from './content.repository';

describe('InMemoryContentRepository', () => {
  test('creates and finds content records', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');

    const record = await repository.create({
      type: 'post',
      title: 'Hello',
      slug: 'hello',
      summary: 'Intro',
      bodyMarkdown: '# Hello',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Writing'],
      tags: ['Platform'],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect(await repository.findById(record.id)).toEqual(record);
  });

  test('updates existing records immutably', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');
    const record = await repository.create({
      type: 'post',
      title: 'Draft',
      slug: 'draft',
      summary: 'Draft',
      bodyMarkdown: '# Draft',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    const updated = await repository.update(record.id, {
      status: 'published',
      publishedAt: '2026-06-10T00:00:00.000Z',
      categories: ['Updated'],
      tags: ['Release'],
    });

    if (!updated) {
      throw new Error('Expected updated content record');
    }

    expect(updated.status).toBe('published');
    expect(updated.categories).toEqual(['Updated']);
    expect(updated.tags).toEqual(['Release']);
    expect(record.status).toBe('draft');
    expect(record.categories).toEqual([]);
  });

  test('lists admin records by newest update first', async () => {
    let now = '2026-06-10T00:00:00.000Z';
    const repository = new InMemoryContentRepository(() => now);
    await repository.create({
      type: 'post',
      title: 'Old',
      slug: 'old',
      summary: 'Old',
      bodyMarkdown: '# Old',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });
    now = '2026-06-11T00:00:00.000Z';
    const newest = await repository.create({
      type: 'note',
      title: 'New',
      slug: 'new',
      summary: 'New',
      bodyMarkdown: '# New',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect((await repository.listAdmin())[0]?.id).toBe(newest.id);
  });
});

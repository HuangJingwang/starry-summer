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
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Writing'],
      tags: ['Platform'],
      series: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect(await repository.findById(record.id)).toEqual(record);
    expect(record.series).toEqual([]);
    expect(await repository.findBySlug('hello')).toEqual(record);
    expect(await repository.findBySlug('missing')).toBeNull();
  });

  test('updates existing records immutably', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');
    const record = await repository.create({
      type: 'post',
      title: 'Draft',
      slug: 'draft',
      summary: 'Draft',
      bodyMarkdown: '# Draft',
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
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

  test('deletes records permanently', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');
    const record = await repository.create({
      type: 'post',
      title: 'Delete Me',
      slug: 'delete-me',
      summary: 'Temporary',
      bodyMarkdown: '# Delete Me',
      sourceType: 'original',
      sourceUrl: '',
      status: 'archived',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    await expect(repository.delete(record.id)).resolves.toBe(true);
    await expect(repository.findById(record.id)).resolves.toBeNull();
    await expect(repository.delete(record.id)).resolves.toBe(false);
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
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
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
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect((await repository.listAdmin())[0]?.id).toBe(newest.id);
  });

  test('filters admin records by type status visibility and search text', async () => {
    let now = '2026-06-10T00:00:00.000Z';
    const repository = new InMemoryContentRepository(() => now);
    const draft = await repository.create({
      type: 'post',
      title: 'Draft Post',
      slug: 'draft-post',
      summary: 'Draft summary',
      bodyMarkdown: '# Draft',
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Drafts'],
      tags: ['Writing'],
      series: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });
    now = '2026-06-11T00:00:00.000Z';
    const privateProject = await repository.create({
      type: 'project',
      title: 'Private Project',
      slug: 'private-project',
      summary: 'Private work',
      bodyMarkdown: '# Project',
      sourceType: 'original',
      sourceUrl: '',
      status: 'published',
      visibility: 'private',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Lab'],
      tags: ['Roadmap'],
      series: ['Platform Journal'],
      viewCount: 0,
      likeCount: 0,
      publishedAt: '2026-06-11T00:00:00.000Z',
    });

    expect((await repository.listAdmin({ type: 'project' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ status: 'draft' })).map((item) => item.id)).toEqual([draft.id]);
    expect((await repository.listAdmin({ status: 'private' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ category: 'lab' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ tag: 'roadmap' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ series: 'platform journal' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ tag: 'writing' })).map((item) => item.id)).toEqual([draft.id]);
    expect((await repository.listAdmin({ query: 'roadmap' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ query: 'platform journal' })).map((item) => item.id)).toEqual([privateProject.id]);
    expect((await repository.listAdmin({ query: 'draft-post' })).map((item) => item.id)).toEqual([draft.id]);
  });

  test('lists public records by popularity when requested', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');
    const recent = await repository.create({
      type: 'post',
      title: 'Recent',
      slug: 'recent',
      summary: 'Recent',
      bodyMarkdown: '# Recent',
      sourceType: 'original',
      sourceUrl: '',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 10,
      likeCount: 1,
      publishedAt: '2026-06-12T00:00:00.000Z',
    });
    const popular = await repository.create({
      type: 'post',
      title: 'Popular',
      slug: 'popular',
      summary: 'Popular',
      bodyMarkdown: '# Popular',
      sourceType: 'original',
      sourceUrl: '',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 20,
      likeCount: 5,
      publishedAt: '2026-06-11T00:00:00.000Z',
    });
    const pinned = await repository.create({
      type: 'post',
      title: 'Pinned',
      slug: 'pinned',
      summary: 'Pinned',
      bodyMarkdown: '# Pinned',
      sourceType: 'original',
      sourceUrl: '',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: true,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 1,
      likeCount: 0,
      publishedAt: '2026-06-10T00:00:00.000Z',
    });

    expect((await repository.listPublic({ type: 'post' })).map((item) => item.id)).toEqual([pinned.id, recent.id, popular.id]);
    expect((await repository.listPublic({ type: 'post', sort: 'popular' })).map((item) => item.id)).toEqual([
      pinned.id,
      popular.id,
      recent.id,
    ]);
  });

  test('filters public records by search text', async () => {
    const repository = new InMemoryContentRepository(() => '2026-06-10T00:00:00.000Z');
    const matching = await repository.create({
      type: 'post',
      title: 'Cloud Backup Plan',
      slug: 'cloud-backup-plan',
      summary: 'PostgreSQL restore notes',
      bodyMarkdown: '# Cloud Backup',
      sourceType: 'original',
      sourceUrl: '',
      status: 'published',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: ['Operations'],
      tags: ['Backup'],
      series: ['Platform Journal'],
      viewCount: 0,
      likeCount: 0,
      publishedAt: '2026-06-10T00:00:00.000Z',
    });
    await repository.create({
      type: 'post',
      title: 'Private Cloud Notes',
      slug: 'private-cloud-notes',
      summary: 'Hidden',
      bodyMarkdown: '# Private',
      sourceType: 'original',
      sourceUrl: '',
      status: 'draft',
      visibility: 'public',
      allowComments: true,
      pinned: false,
      featured: false,
      categories: [],
      tags: [],
      series: [],
      viewCount: 0,
      likeCount: 0,
      publishedAt: null,
    });

    expect((await repository.listPublic({ query: 'postgresql backup' })).map((item) => item.id)).toEqual([matching.id]);
    expect((await repository.listPublic({ query: 'platform journal' })).map((item) => item.id)).toEqual([matching.id]);
  });
});
